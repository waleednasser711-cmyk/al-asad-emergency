import {z} from 'zod';
import {buildSalesAccounting} from './sales-summary.ts';
import {buildRepProductSales,addProductSales} from './rep-product-sales.ts';
import {apply,check,salePrice,type State} from './business.ts';
import {assignedToRep} from './rep-assignments.ts';
import {cairoDay,addDays} from './enhancements.ts';
const id=z.string().min(1).max(1000);
export const offlineSaleSchema=z.object({id:z.string().uuid(),actorId:id,createdAt:z.string().datetime(),priceTier:z.enum(['retail','wholesale']),customerId:id,payment:z.enum(['cash','credit']),paid:z.number().finite().min(0).max(100000000),note:z.string().max(1000).default(''),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),lines:z.array(z.object({productId:id,unit:z.enum(['piece','carton']),quantity:z.number().int().min(1).max(100000000),pack:z.number().int().min(1).max(100000000),price:z.number().finite().min(0).max(100000000)})).min(1).max(200)});
export type OfflineSale= z.infer<typeof offlineSaleSchema>;
export type QueuedSale={id:string,actorId:string,payload:OfflineSale,receipt:any,error?:string};
export function localSale(data:any,body:any,id:string,createdAt=new Date().toISOString()):QueuedSale{
 check(data?.user?.role==='rep','الحفظ المحلي للمندوب فقط');
 const actor=data.user,s=structuredClone(data.state) as State;
 for(const p of s.products){p.cost=0;p.repIds=p.saleAllowed===false?[]:[actor.id];}
 for(const d of s.documents){d.number=typeof d.number==='number'?d.number:0;for(const l of d.lines||[])l.cost=0;}
 const payload=offlineSaleSchema.parse({id,actorId:actor.id,createdAt,priceTier:actor.priceTier||'retail',customerId:body.customerId,payment:body.payment,paid:Number(body.paid||0),note:String(body.note||''),dueDate:body.dueDate||null,lines:body.lines?.map((l:any)=>({...l,price:Number(l.price),pack:s.products.find(p=>p.id===l.productId)?.pack}))});
 const receipt=apply(s,actor,{...payload,action:'sale'},[actor.id]);
 payload.dueDate=receipt.dueDate||null;
 receipt.id=id;receipt.number='محلي-'+id.slice(0,8);receipt.at=createdAt;receipt.offlineId=id;receipt.localOnly=true;
 return {id,actorId:actor.id,payload,receipt};
}
export function pendingSales(data:any,queue:QueuedSale[]){const posted=new Set([...(data?.syncedSaleIds||[]),...(data?.state?.documents||[]).filter((d:any)=>d.type==='sale').map((d:any)=>d.offlineId)]);return queue.filter(q=>q.actorId===data?.user?.id&&!posted.has(q.id));}
export function projectSales(data:any,queue:QueuedSale[]){
 if(data?.user?.role!=='rep')return data;
 const result=structuredClone(data),s=result.state,actor=data.user.id;
 s.salesAccounting??=buildSalesAccounting(s.documents,actor);
 s.repProductSales??=buildRepProductSales(s.documents,s.products,actor);
 for(const q of pendingSales(data,queue)){
  const d=structuredClone(q.receipt);s.stocks[actor]??={};
  for(const l of d.lines)s.stocks[actor][l.productId]=(s.stocks[actor][l.productId]||0)-l.pieces;
  s.cash[actor]=(s.cash[actor]||0)+d.paid;
  const c=s.customers.find((c:any)=>c.id===d.customerId);if(c)c.debt+=d.total-d.paid;
  s.documents.push(d);
  addProductSales(s.repProductSales,[d],s.products);
  const day=cairoDay(d.at),totals=s.salesAccounting.days[day]??={sales:0,returns:0,netSales:0,invoices:0,returnInvoices:0};totals.sales+=d.total;totals.netSales=totals.sales-totals.returns;totals.invoices++;
  if(d.paid)s.ledger.push({id:'local-'+q.id,at:d.at,location:actor,amount:d.paid,kind:'بيع نقدي',ref:d.id,actor:d.actorName});
 }
 // Preserve server aggregates for customers whose assignment has since been revoked.
 return result;
}
export function postOfflineSale(state:State,rep:any,payload:OfflineSale,repIds:string[],reviewer?:any,reason=''){
 check(rep?.role==='rep'&&rep.active&&rep.id===payload.actorId,'حساب المندوب موقوف أو غير صالح');
 check((rep.priceTier||'retail')===payload.priceTier,'تغير تصنيف سعر المندوب؛ يلزم مراجعة الفاتورة');
 check(assignedToRep(state.customers.find(c=>c.id===payload.customerId),rep.id),'العميل لم يعد مخصصًا للمندوب');
 for(const l of payload.lines){const p=state.products.find(p=>p.id===l.productId);check(assignedToRep(p,rep.id),'الصنف لم يعد مخصصًا للمندوب');check(p.pack===l.pack,'تغيرت تعبئة الصنف؛ يلزم مراجعة الفاتورة');check(salePrice(p,payload.priceTier,l.unit)===Math.round(l.price*100),'تغير سعر الصنف؛ يلزم مراجعة الفاتورة');}
 check(Date.parse(payload.createdAt)<=Date.now()+300000&&Date.parse(payload.createdAt)>=Date.parse('2020-01-01'),'تاريخ الفاتورة غير صالح');
 if(payload.dueDate)check(addDays(payload.dueDate,0)===payload.dueDate&&payload.dueDate>=cairoDay(payload.createdAt),'موعد السداد غير صالح');
 const doc=apply(state,reviewer||rep,{...payload,action:'sale',dueDate:undefined,repId:rep.id,saleTier:payload.priceTier,...(reviewer?{creditOverrideReason:reason}:{})},repIds);
 doc.actorId=rep.id;doc.actorName=rep.name;doc.at=payload.createdAt;doc.syncedAt=new Date().toISOString();doc.offlineId=payload.id;
 if(payload.dueDate)doc.dueDate=payload.dueDate;
 else if(doc.total>doc.paid&&state.customers.find(c=>c.id===payload.customerId)?.creditDays)doc.dueDate=addDays(cairoDay(payload.createdAt),state.customers.find(c=>c.id===payload.customerId)!.creditDays);
 for(const l of state.ledger.filter(l=>l.ref===doc.id))l.at=payload.createdAt;
 if(reviewer){doc.reviewedBy=reviewer.id;doc.reviewReason=reason;}
 return doc;
}
export function parseQueueBackup(value:any,actorId:string):QueuedSale[]{
 check(value?.format==='asad-offline-sales-v1'&&value.actorId===actorId&&Array.isArray(value.sales)&&value.sales.length<=10000,'ملف فواتير محلية غير صالح لهذا الحساب');
 const ids=new Set<string>();
 return value.sales.map((q:any)=>{const payload=offlineSaleSchema.parse(q.payload);check(payload.actorId===actorId&&q.id===payload.id&&q.receipt?.id===q.id&&q.receipt?.offlineId===q.id&&q.receipt?.location===actorId,'بيانات فاتورة محلية غير متطابقة');const d=q.receipt,total=payload.lines.reduce((n,l)=>n+Math.round(l.price*100)*l.quantity,0),paid=payload.payment==='cash'?total:Math.round(payload.paid*100);check(d.type==='sale'&&d.total===total&&d.paid===paid&&d.customerId===payload.customerId&&d.at===payload.createdAt&&d.localOnly===true&&Array.isArray(d.lines)&&d.lines.length===payload.lines.length&&d.lines.every((l:any,i:number)=>{const p=payload.lines[i];return l.productId===p.productId&&l.unit===p.unit&&l.quantity===p.quantity&&l.pieces===p.quantity*(p.unit==='carton'?p.pack:1)&&l.price===Math.round(p.price*100)&&l.total===l.price*l.quantity;}),'تفاصيل الفاتورة المحلية غير صالحة');check(!ids.has(q.id),'معرف فاتورة مكرر');ids.add(q.id);return {id:q.id,actorId,payload,receipt:q.receipt,error:q.error};});
}

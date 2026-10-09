import {accountSalesSummary} from './sales-summary.ts';
import {isPosted,documentAt} from './document-status.ts';
import type {State} from './business.ts';
export const cairoDay=(at:string|Date=new Date())=>new Date(at).toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'});
const dayNumber=(s:string)=>Date.parse(s+'T12:00:00Z')/86400000;
export const addDays=(day:string,n:number)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export function customerAging(s:State,c:any,day=cairoDay()){
 const docs=s.documents.filter(d=>isPosted(d)&&d.customerId===c.id&&(['sale','saleReturn','collection'].includes(d.type)||d.type==='debt'&&d.entity!=='supplier')).slice().sort((a,b)=>documentAt(a).localeCompare(documentAt(b))||a.number-b.number);
 const delta=(d:any)=>d.type==='sale'?d.total-d.paid:d.type==='saleReturn'?-(d.total-d.refund):d.type==='collection'?-d.amount:d.after-d.before;
 const lots:any[]=[];const opening=c.debt-docs.reduce((n,d)=>n+delta(d),0);if(opening>0)lots.push({amount:opening,dueDate:null,id:'opening'});
 const reduce=(n:number,originalId?:string)=>{const order=originalId?[...lots.filter(l=>l.id===originalId),...lots.filter(l=>l.id!==originalId)]:lots;for(const lot of order){const take=Math.min(lot.amount,n);lot.amount-=take;n-=take;if(!n)break}};
 for(const d of docs){const n=delta(d);if(n>0)lots.push({id:d.id,amount:n,dueDate:d.type==='sale'?d.dueDate:null});else if(n<0)reduce(-n,d.type==='saleReturn'?d.originalId:undefined);}
 // Legacy/manual balances without a dated invoice stay explicitly unclassified.
 const result={notDue:0,days30:0,days60:0,over60:0,undated:0,total:c.debt,overdue:0,lots:lots.filter(l=>l.amount>0)};
 for(const l of result.lots){if(!l.dueDate){result.undated+=l.amount;continue}const days=Math.floor(dayNumber(day)-dayNumber(l.dueDate));if(days<=0)result.notDue+=l.amount;else if(days<=30)result.days30+=l.amount;else if(days<=60)result.days60+=l.amount;else result.over60+=l.amount;}
 result.overdue=result.days30+result.days60+result.over60;return result;
}
export function commissionFor(s:State,repId:string,month:string){
 const rule=s.commissionRules?.[month]?.[repId];const docs=s.documents.filter(d=>isPosted(d)&&d.location===repId&&cairoDay(documentAt(d)).slice(0,7)===month);
 const netSales=accountSalesSummary(s,repId,month+'-01',month+'-31').netSales;
 const receipts=s.ledger.filter(l=>l.location===repId&&cairoDay(l.at).slice(0,7)===month&&['بيع نقدي','تحصيل عميل','رد نقدية عميل'].includes(l.kind)).reduce((n,l)=>n+l.amount,0);
 const target=s.targets?.[month]?.[repId]||0,achieved=target>0&&netSales>=target;
 const basis=Math.max(0,rule?.base==='receipts'?receipts:rule?.base==='target'&&!achieved?0:netSales);
 const earned=rule?Math.round(basis*rule.rateBps/10000)+(achieved?rule.bonus:0):0;
 const paid=s.documents.filter(d=>d.type==='commissionPayment'&&d.repId===repId&&d.month===month).reduce((n,d)=>n+d.amount,0);
 return {rule,netSales,receipts,target,achieved,basis,earned,paid,due:Math.max(0,earned-paid)};
}
export function repDay(s:State,repId:string,day=cairoDay()){
 const docs=s.documents.filter(d=>isPosted(d)&&cairoDay(documentAt(d))===day&&(d.location===repId||d.repId===repId)),ls=s.ledger.filter(l=>l.location===repId&&cairoDay(l.at)===day);
 const openingCash=s.ledger.filter(l=>l.location===repId&&cairoDay(l.at)<day).reduce((n,l)=>n+l.amount,0);
 const totals=accountSalesSummary(s,repId,day,day);
 const products=s.products.map(p=>{const sum=(type:string)=>docs.filter(d=>d.type===type&&d.status==='approved').reduce((n,d)=>n+(d.lines||[]).filter((l:any)=>l.productId===p.id).reduce((v:number,l:any)=>v+l.pieces,0),0);return {productId:p.id,name:p.name,loaded:sum('load'),sold:sum('sale'),returned:sum('saleReturn'),toWarehouse:sum('carReturn'),current:s.stocks[repId]?.[p.id]||0}});
 return {day,openingCash,incoming:ls.filter(l=>l.amount>0).reduce((n,l)=>n+l.amount,0),outgoing:ls.filter(l=>l.amount<0).reduce((n,l)=>n-l.amount,0),closingCash:openingCash+ls.reduce((n,l)=>n+l.amount,0),sales:totals.sales,saleReturns:totals.returns,netSales:totals.netSales,collections:ls.filter(l=>l.kind==='تحصيل عميل').reduce((n,l)=>n+l.amount,0),deposits:ls.filter(l=>l.kind==='توريد نقدية').reduce((n,l)=>n-l.amount,0),invoices:totals.invoices,products};
}
export function findBarcode(products:any[],raw:string){const code=raw.trim();if(!code)return null;const p=products.find(p=>p.barcode===code||p.cartonBarcode===code||p.code===code);return p?{product:p,unit:p.cartonBarcode===code?'carton':'piece'}:null;}

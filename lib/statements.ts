import {check} from './business.ts';
import {isPosted,documentAt} from './document-status.ts';
import {cairoDay,addDays} from './enhancements.ts';
export function accountStatement(s:any,id:string,entity='customer',from='',to=''){
 check(['customer','supplier'].includes(entity),'نوع حساب غير صالح');for(const day of [from,to].filter(Boolean))check(/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day))&&addDays(day,0)===day,'تاريخ الفترة غير صالح');check(!from||!to||from<=to,'بداية الفترة بعد نهايتها');
 const c=s[entity==='customer'?'customers':'suppliers'].find((x:any)=>x.id===id);check(c,'الحساب غير موجود');
 const docs=s.documents.filter((d:any)=>isPosted(d)&&(entity==='customer'?d.customerId===id&&(['sale','saleReturn','collection'].includes(d.type)||d.type==='debt'&&d.entity!=='supplier'):d.supplierId===id&&['purchase','supplierPay'].includes(d.type)||d.customerId===id&&(d.type==='purchaseReturn'||d.type==='debt'&&d.entity==='supplier'))).slice().sort((a:any,b:any)=>Date.parse(documentAt(a))-Date.parse(documentAt(b))||a.number-b.number);
 const amounts=(d:any)=>['sale','purchase'].includes(d.type)?{debit:d.total,credit:d.paid}:['saleReturn','purchaseReturn'].includes(d.type)?{debit:d.refund,credit:d.total}:d.type==='debt'?{debit:Math.max(0,d.after-d.before),credit:Math.max(0,d.before-d.after)}:{debit:0,credit:d.amount};
 const delta=(d:any)=>{const x=amounts(d);return x.debit-x.credit;};let balance=c.debt-docs.reduce((n:number,d:any)=>n+delta(d),0),opening=balance;const rows:any[]=[];
 for(const d of docs){const day=cairoDay(documentAt(d));if(from&&day<from){balance+=delta(d);opening=balance;continue;}if(to&&day>to)continue;const x=amounts(d);balance+=x.debit-x.credit;rows.push({id:d.id,number:d.number,type:d.type,at:documentAt(d),...x,balance,total:d.total,paid:d.paid,refund:d.refund,originalNumber:d.originalNumber,note:d.note||d.reason||'',lines:(d.lines||[]).map((l:any)=>({name:l.name,quantity:l.quantity,unit:l.unit,price:l.price,total:l.total}))});}
 return {entity,account:{id:c.id,name:c.name,code:c.code,phone:c.phone,address:c.address},from,to,opening,closing:balance,current:c.debt,totalDebit:rows.reduce((n,r)=>n+r.debit,0),totalCredit:rows.reduce((n,r)=>n+r.credit,0),rows};
}

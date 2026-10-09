import assert from 'node:assert/strict';
import {blank,apply} from '../lib/business.ts';
import {salesSummary} from '../lib/sales-summary.ts';
import {createReports} from '../lib/reports.ts';
import {validateBackup} from '../lib/backup.ts';
const admin={id:'a',name:'مدير',role:'admin'},rep={id:'r',name:'مندوب',role:'rep'};
const finances=s=>({cash:s.cash,stocks:s.stocks,customers:s.customers,products:s.products,ledger:s.ledger,summary:salesSummary(s.documents),profit:createReports(s,[rep],{},'2026-10').profit()});
function fixture(payment='cash'){
 let s=blank();const run=(actor,b)=>{const next=structuredClone(s),d=apply(next,actor,b,['r']);s=next;return d;};
 run(admin,{action:'product',name:'صنف',code:'P',pack:1,piecePrice:10,cartonPrice:10,cost:5});const p=s.products[0].id;
 run(admin,{action:'customer',name:'عميل',code:'C'});const c=s.customers[0].id;
 run(admin,{action:'stock',repId:'r',productId:p,quantity:3,reason:'اختبار'});
 const sale=run(rep,{action:'sale',customerId:c,lines:[{productId:p,unit:'piece',quantity:3}],payment,paid:0});
 const d=run(rep,{action:'saleReturn',invoiceId:sale.id,lines:[{productId:p,unit:'piece',quantity:2}],refundMode:'auto'});
 run(admin,{action:'reject',id:d.id,reason:'مراجعة ناقصة'});
 return {run,state:()=>s,p,c,sale,d,denied:(actor,b)=>{const before=structuredClone(s);assert.throws(()=>apply(structuredClone(s),actor,b,['r']));assert.deepEqual(s,before);}};
}
for(const payment of ['cash','credit']){
 const f=fixture(payment),before=structuredClone(finances(f.state()));
 f.denied(rep,{action:'reopenSaleReturn',id:f.d.id,reason:'إعادة النظر'});
 f.denied(admin,{action:'reopenSaleReturn',id:f.d.id,reason:' '});
 f.denied(admin,{action:'reopenSaleReturn',id:f.sale.id,reason:'نوع خاطئ'});
 for(let i=0;i<2;i++){
  const reopened=f.run(admin,{action:'reopenSaleReturn',id:f.d.id,reason:'تمت مراجعة البيانات '+i});
  assert.equal(reopened.status,'pending');assert.equal(reopened.id,f.d.id);assert.equal(reopened.total,f.d.total);assert.equal(reopened.refund,f.d.refund);
  assert.equal(reopened.reviewHistory.length,i+1);assert.equal(reopened.reviewHistory[i].rejectionReason,i===0?'مراجعة ناقصة':'تأكيد آخر');
  assert.ok(!reopened.reviewedAt);assert.ok(!reopened.reviewReason);assert.deepEqual(finances(f.state()),before);
  f.denied(admin,{action:'reopenSaleReturn',id:f.d.id,reason:'تكرار'});
  assert.deepEqual(validateBackup(f.state(),[admin,rep]).documents,f.state().documents);
  if(i===0)f.run(admin,{action:'reject',id:f.d.id,reason:'تأكيد آخر'});
 }
 const approved=f.run(admin,{action:'approve',id:f.d.id});
 assert.equal(approved.status,'approved');assert.equal(salesSummary(f.state().documents).netSales,1000);
 assert.equal(f.state().cash.r||0,payment==='cash'?1000:0);assert.equal(f.state().customers[0].debt,payment==='credit'?1000:0);assert.equal(f.state().stocks.r[f.p],2);
 f.denied(admin,{action:'approve',id:f.d.id});f.denied(admin,{action:'reopenSaleReturn',id:f.d.id,reason:'معتمد بالفعل'});
 assert.deepEqual(validateBackup(f.state(),[admin,rep]).documents,f.state().documents);
 const corrupt=structuredClone(f.state());corrupt.documents.find(d=>d.id===f.d.id).reviewHistory[0].reopenedAt='invalid';assert.throws(()=>validateBackup(corrupt,[admin,rep]));
}
for(const cause of ['otherPending','cancelled','returned']){
 const f=fixture();
 if(cause==='otherPending')f.run(rep,{action:'saleReturn',invoiceId:f.sale.id,lines:[{productId:f.p,quantity:1,unit:'piece'}],refundMode:'auto'});
 if(cause==='cancelled')f.run(admin,{action:'cancelSale',id:f.sale.id,reason:'إلغاء'});
 if(cause==='returned')f.run(admin,{action:'saleReturn',invoiceId:f.sale.id,lines:[{productId:f.p,quantity:2,unit:'piece'}],refundMode:'auto'});
 f.denied(admin,{action:'reopenSaleReturn',id:f.d.id,reason:'مراجعة متأخرة'});
}
for(const payment of ['cash','credit']){
 const f=fixture(payment);f.run(admin,{action:'reopenSaleReturn',id:f.d.id,reason:'إعادة النظر'});
 // Changes after reopening must be rechecked on approval, with no partial settlement.
 if(payment==='cash')f.state().cash.r=0;else f.state().customers[0].debt=0;
 f.denied(admin,{action:'approve',id:f.d.id});assert.equal(f.state().documents.find(d=>d.id===f.d.id).status,'pending');
}
console.log('PASS: admin-only rejected-return reopening, required reason, immutable balances/reports, preserved rejection/reopening history and backup, repeated cycles, exactly-once approval, competing pending/cancelled/consumed quantities and live cash/debt safety');

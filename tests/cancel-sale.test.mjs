import assert from 'node:assert/strict';
import {blank,apply} from '../lib/business.ts';
import {salesSummary} from '../lib/sales-summary.ts';
import {createReports} from '../lib/reports.ts';
import {validateBackup} from '../lib/backup.ts';
import {accountStatement} from '../lib/statements.ts';
import {printableDocument} from '../lib/print-documents.ts';
const admin={id:'a',name:'مدير',role:'admin'},rep={id:'r',name:'مندوب',role:'rep'};
for(const location of ['warehouse','r'])for(const payment of ['cash','credit','mixed','collected'])for(const prior of ['none','partial','full']){
 let s=blank();const run=(actor,b)=>{const next=structuredClone(s),doc=apply(next,actor,b,['r']);s=next;return doc;};
 run(admin,{action:'product',name:'صنف',code:'P',pack:3,piecePrice:4,cartonPrice:10.01,cost:1});const p=s.products[0].id;
 run(admin,{action:'customer',name:'عميل',code:'C'});const c=s.customers[0].id;
 run(admin,{action:'stock',...(location==='r'?{repId:'r'}:{}),productId:p,quantity:3,reason:'اختبار'});
 const actor=location==='r'?rep:admin,cashLoc=location==='r'?'r':'main';
 const invoice=run(actor,{action:'sale',customerId:c,lines:[{productId:p,quantity:1,unit:'carton'}],payment:payment==='cash'?'cash':'credit',paid:payment==='mixed'?4:0});
 if(payment==='collected')run(actor,{action:'collection',customerId:c,amount:10.01});
 if(prior!=='none')run(admin,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:prior==='full'?3:1,unit:'piece'}],refundMode:'auto'});
 const before=structuredClone(s),reject=body=>{assert.throws(()=>apply(structuredClone(s),body.actor||admin,body,['r']));assert.deepEqual(s,before);};
 reject({action:'cancelSale',id:invoice.id,reason:'سبب',actor:rep});reject({action:'cancelSale',id:invoice.id,reason:'  '});
 const result=run(admin,{action:'cancelSale',id:invoice.id,reason:'فاتورة مكررة <script>bad</script>'});
 assert.equal(result.id,invoice.id);assert.ok(result.cancelledAt);assert.equal(result.cancelledBy,admin.name);
 assert.equal(result.total,1001);assert.equal(result.status,'approved');assert.equal(result.paid,invoice.paid);
 assert.equal(salesSummary(s.documents).netSales,0);assert.equal(createReports(s,[rep],{},'2099-01').profit().netSales,0);
 assert.equal(s.customers[0].debt,0);assert.equal(accountStatement(s,c).closing,0);assert.equal(s.cash[cashLoc]||0,0);assert.equal(s.stocks[location][p],3);
 assert.equal(s.cash[location==='r'?'main':'r']||0,0);
 assert.equal(s.documents.filter(d=>d.type==='saleReturn').length,before.documents.filter(d=>d.type==='saleReturn').length+(prior==='full'?0:1));
 const settled=structuredClone(s);assert.throws(()=>apply(structuredClone(s),admin,{action:'cancelSale',id:invoice.id,reason:'مرة ثانية'},['r']));assert.deepEqual(s,settled);
 assert.throws(()=>apply(structuredClone(s),rep,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:1,unit:'piece'}],refundMode:'auto'},['r']));
 const restored=validateBackup(s,[admin,rep]);assert.deepEqual(restored.documents,s.documents);
 const html=printableDocument(result,s.settings,rep.name);assert.ok(html.includes('فاتورة ملغاة'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>bad'));
 const corrupt=structuredClone(s);corrupt.documents.find(d=>d.id===invoice.id).cancellationReturnId='missing';assert.throws(()=>validateBackup(corrupt,[admin,rep]));
}
// A pending return must be reviewed first; insufficient cash must never partially cancel.
for(const blocked of ['pending','cash']){
 let s=blank();const run=(a,b)=>apply(s,a,b,['r']);
 run(admin,{action:'product',name:'صنف',code:'P',pack:1,piecePrice:10,cartonPrice:10,cost:1});const p=s.products[0].id;
 run(admin,{action:'customer',name:'عميل',code:'C'});const c=s.customers[0].id;
 run(admin,{action:'stock',repId:'r',productId:p,quantity:1,reason:'اختبار'});
 const sale=run(rep,{action:'sale',customerId:c,lines:[{productId:p,quantity:1,unit:'piece'}],payment:'cash'});
 if(blocked==='pending')run(rep,{action:'saleReturn',invoiceId:sale.id,lines:[{productId:p,quantity:1,unit:'piece'}],refundMode:'auto'});
 else s.cash.r=0;
 const before=structuredClone(s);assert.throws(()=>apply(structuredClone(s),admin,{action:'cancelSale',id:sale.id,reason:'اختبار'},['r']));assert.deepEqual(s,before);
}
console.log('PASS: admin-only reason-required cancellation, cash/credit/mixed/collected at own main/rep cash, no/partial/full prior returns, exact cents/stock/debt/net-sales/statements, pending/cash safety, double settlement refusal, backup preservation and escaped cancelled printing');

import assert from 'node:assert/strict';
import {blank,apply,visible} from '../lib/business.ts';
import {salesSummary,approvedReturnsByInvoice,accountSalesSummary} from '../lib/sales-summary.ts';
import {createReports} from '../lib/reports.ts';
import {commissionFor,customerAging,repDay,cairoDay} from '../lib/enhancements.ts';
import {accountStatement} from '../lib/statements.ts';
import {buildReportExport} from '../lib/report-export.ts';
import {fmt} from '../lib/format.ts';
const a={id:'a',name:'مدير',role:'admin'},r={id:'r',name:'مندوب',role:'rep'},day=cairoDay(),month=day.slice(0,7);
for(const location of ['warehouse','r'])for(const payment of ['cash','credit','mixed']){
 let s=blank();const run=(actor,body)=>{const next=structuredClone(s);const result=apply(next,actor,body,['r']);s=next;return result;};
 run(a,{action:'product',name:'صنف',code:'P',pack:10,piecePrice:10,cartonPrice:90,cost:5});const p=s.products[0].id;
 run(a,{action:'customer',name:'عميل',code:'C'});const c=s.customers[0].id;
 run(a,{action:'stock',...(location==='r'?{repId:'r'}:{}),productId:p,quantity:20,reason:'اختبار'});
 const actor=location==='r'?r:a,cashLocation=location==='r'?'r':'main';
 run(a,{action:'commissionRule',repId:'r',month,base:'netSales',rate:10});
 const sale=run(actor,{action:'sale',customerId:c,lines:[{productId:p,unit:'carton',quantity:1}],payment:payment==='cash'?'cash':'credit',paid:payment==='mixed'?30:0});
 const initial=s.cash[cashLocation]||0;let cumulativeReturn=0,cumulativeRefund=0;
 const verify=()=>{
  const before=structuredClone(s),summary=salesSummary(s.documents),reports=createReports(s,[r],{},month);
  assert.equal(summary.netSales,9000-cumulativeReturn);assert.equal(summary.returns,cumulativeReturn);
  assert.equal(reports.profit().netSales,summary.netSales);assert.equal(reports.profit().cost,5000-cumulativeReturn*5000/9000);
  assert.equal(reports.productReport()[0][4],fmt(summary.netSales));
  assert.equal(reports.repReport().find(row=>row[0]===(location==='r'?'مندوب':'المخزن الرئيسي'))[4],fmt(summary.netSales));
  assert.equal(s.cash[cashLocation]||0,initial-cumulativeRefund);
  assert.equal(s.customers[0].debt,9000-initial-(cumulativeReturn-cumulativeRefund));
  assert.equal(accountStatement(s,c).closing,s.customers[0].debt);assert.equal(customerAging(s,s.customers[0]).total,s.customers[0].debt);
  assert.equal(s.stocks[location][p],10+cumulativeReturn/900);
  assert.equal(approvedReturnsByInvoice(s.documents)[sale.id]||0,cumulativeReturn);
  assert.equal(s.documents.find(d=>d.id===sale.id).total,9000);
  for(const tab of ['profit','reps','products','cash','inventory','balances'])assert.ok(buildReportExport(s,[r],{},month,tab,{}).rows.length);
  if(location==='r'){
   assert.equal(repDay(s,'r',day).netSales,summary.netSales);assert.equal(repDay(s,'r',day).closingCash,s.cash.r||0);
   assert.equal(commissionFor(s,'r',month).netSales,summary.netSales);
   assert.equal(salesSummary(visible(s,r).documents).netSales,summary.netSales);
  }
  assert.deepEqual(s,before,'All summaries are read-only');
 };
 verify();
 for(const quantity of [2,8]){
  const total=quantity*900,refund=payment==='cash'?total:payment==='mixed'?(quantity===2?1800:1200):0;
  const previous=structuredClone(s),returned=run(actor,{action:'saleReturn',invoiceId:sale.id,lines:[{productId:p,unit:'piece',quantity}],refund:refund/100});
  if(location==='r'){
   for(const key of ['cash','stocks','products','customers','ledger'])assert.deepEqual(s[key],previous[key]);
   assert.equal(salesSummary(s.documents).netSales,9000-cumulativeReturn);
   run(a,{action:'approve',id:returned.id});
  }
  cumulativeReturn+=total;cumulativeRefund+=refund;verify();
  const settled=structuredClone(s);assert.throws(()=>run(a,{action:'approve',id:returned.id}));assert.deepEqual(s,settled);
 }
 if(location==='r'){
  const beforeRevocation=structuredClone(s);s.customers[0].repIds=[];
  const projected=visible(s,r);assert.equal(projected.documents.some(d=>d.customerId===c),false);
  assert.deepEqual(accountSalesSummary(projected,'r'),salesSummary(s.documents));
  assert.equal(commissionFor(projected,'r',month).netSales,commissionFor(s,'r',month).netSales);
  assert.equal(repDay(projected,'r',day).netSales,repDay(s,'r',day).netSales);
  const encoded=JSON.stringify(projected.salesAccounting);for(const secret of [c,sale.id,'صنف','عميل','cost','customerId','originalId'])assert.equal(encoded.includes(secret),false);
  const restored=await import('../lib/backup.ts');assert.equal(restored.validateBackup({...beforeRevocation,salesAccounting:projected.salesAccounting},[a,r]).salesAccounting,undefined);
 }
 assert.equal(salesSummary(s.documents).netSales,0);assert.equal(s.customers[0].debt,0);assert.equal(s.cash[cashLocation]||0,0);
 // A previous-period invoice returned this period creates negative current-period net sales.
 s.documents.find(d=>d.id===sale.id).at='2025-01-01T12:00:00Z';
 const current=s.documents.filter(d=>cairoDay(d.postedAt||d.at)===day);
 assert.equal(salesSummary(current).netSales,-9000);
 assert.equal(createReports(s,[r],{from:day,to:day},month).profit().netSales,-9000);
}
assert.deepEqual(salesSummary([{type:'sale',total:100,status:'approved'},{type:'saleReturn',total:100,status:'pending'},{type:'saleReturn',total:100,status:'rejected'},{type:'purchaseReturn',total:100}]),{sales:100,returns:0,netSales:100,invoices:1,returnInvoices:0});
assert.equal(salesSummary([{type:'sale',total:100},{type:'saleReturn',total:40}]).netSales,60);
console.log('PASS: full/partial cash, credit and mixed returns in main/rep accounts reconcile net sales, cash, debt, stock, cost/profit, customer statements, aging, commissions, daily closure and report exports; pending/rejected excluded, approval once only, legacy and cross-period returns, read-only historic summaries');

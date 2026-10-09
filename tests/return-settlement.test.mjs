import assert from 'node:assert/strict';
import {blank,apply} from '../lib/business.ts';
import {automaticReturnSettlement,returnBasketTotal} from '../lib/return-settlement.ts';
import {salesSummary} from '../lib/sales-summary.ts';
const admin={id:'a',name:'مدير',role:'admin'},rep={id:'r',name:'مندوب',role:'rep'};
for(const location of ['warehouse','r'])for(const payment of ['cash','credit','mixed','collected']){
 let state=blank();
 const run=(actor,body)=>{const next=structuredClone(state),doc=apply(next,actor,body,['r']);state=next;return doc;};
 run(admin,{action:'product',name:'صنف',code:'P',pack:3,piecePrice:4,cartonPrice:10.01,cost:1});const p=state.products[0].id;
 run(admin,{action:'customer',name:'عميل',code:'C'});const c=state.customers[0].id;
 run(admin,{action:'stock',...(location==='r'?{repId:'r'}:{}),productId:p,quantity:3,reason:'اختبار'});
 const actor=location==='r'?rep:admin,cashLoc=location==='r'?'r':'main';
 const invoice=run(actor,{action:'sale',customerId:c,lines:[{productId:p,quantity:1,unit:'carton'}],payment:payment==='cash'?'cash':'credit',paid:payment==='mixed'?4:0});
 if(payment==='collected')run(actor,{action:'collection',customerId:c,amount:10.01});
 // Current catalog prices must not affect return value.
 run(admin,{action:'product',id:p,name:'صنف',code:'P',pack:3,piecePrice:8,cartonPrice:24,cost:1});
 let returned=0;
 for(const quantity of [1,2]){
  const original=state.documents.find(d=>d.id===invoice.id),cart=[{productId:p,quantity,unit:'piece'}];
  const total=returnBasketTotal(original,cart,state.products),customer=state.customers[0];
  assert.equal(total,quantity===1?334:667);
  const expected=automaticReturnSettlement(original,total,customer.debt),before=structuredClone(state);
  // Client-provided refund is ignored in automatic mode.
  const result=run(actor,{action:'saleReturn',invoiceId:invoice.id,lines:cart,refundMode:'auto',refund:99999});
  assert.equal(result.total,total);assert.equal(result.refund,expected.refund);
  if(location==='r'){
   assert.equal(state.customers[0].debt,before.customers[0].debt);assert.equal(state.cash[cashLoc]||0,before.cash[cashLoc]||0);
   run(admin,{action:'approve',id:result.id});
  }
  returned+=total;
  assert.equal(state.customers[0].debt,before.customers[0].debt-expected.debtReduction);
  assert.equal(state.cash[cashLoc]||0,(before.cash[cashLoc]||0)-expected.refund);
  assert.equal(salesSummary(state.documents).netSales,1001-returned);
  const settled=structuredClone(state);assert.throws(()=>apply(structuredClone(state),admin,{action:'approve',id:result.id},['r']));assert.deepEqual(state,settled);
 }
 assert.equal(state.customers[0].debt,0);assert.equal(state.cash[cashLoc]||0,0);assert.equal(state.stocks[location][p],3);
}
assert.deepEqual(automaticReturnSettlement({payment:'cash',total:1000,paid:1000},500,9000),{total:500,debtReduction:0,refund:500});
assert.deepEqual(automaticReturnSettlement({payment:'credit',total:1000,paid:0},500,9000),{total:500,debtReduction:500,refund:0});
assert.equal(automaticReturnSettlement({total:1000,paid:1000},500,9000).refund,500);
assert.equal(automaticReturnSettlement({total:1000,paid:0},500,9000).refund,0);
assert.equal(returnBasketTotal({lines:[{productId:'p',pieces:3,total:1001}],returned:{p:1}},[{productId:'p',quantity:2,unit:'piece'}],[{id:'p',pack:3}]),667);
assert.equal(returnBasketTotal({lines:[{productId:'p',pieces:3,total:1001}]},[],[]),0);
console.log('PASS: automatic cash/credit/mixed/collected returns at main and rep locations; preview/server exact cumulative rounding, original prices, no manual zero/refund required, forged refund ignored, pending non-mutation and exactly-once settlement');

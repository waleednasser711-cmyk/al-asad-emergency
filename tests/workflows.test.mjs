import assert from 'node:assert/strict';
import {blank,apply,visible} from '../lib/business.ts';
const admin={id:'admin',name:'مدير',role:'admin'},rep={id:'r',name:'مندوب',role:'rep'},other={id:'other',name:'آخر',role:'rep'};
let checks=0;
for(let i=1;i<=100;i++){
 let s=blank();const run=(who,b)=>{const candidate=structuredClone(s);const doc=apply(candidate,who,b,['r','other']);s=candidate;return doc};
 const pack=2+i%23,carton=(1001+i*7)/100,cost=(31+i%11)/100,paid=(i%3)*0.5;
 run(admin,{action:'product',name:'صنف',code:'P',pack,piecePrice:2,cartonPrice:carton,cost,minimum:pack});const p=s.products[0].id;
 run(admin,{action:'customer',name:'عميل',code:'C'});const c=s.customers[0].id;run(admin,{action:'stock',productId:p,quantity:pack,reason:'افتتاحي'});
 run(admin,{action:'cashOpening',amount:100});run(admin,{action:'load',repId:'r',lines:[{productId:p,quantity:1,unit:'carton'}]});
 const invoice=run(rep,{action:'sale',customerId:c,lines:[{productId:p,quantity:1,unit:'carton'}],payment:'credit',paid});
 // Return the entire carton in pieces, reconciling cents, frozen cost and debt/cash.
 let refundLeft=Math.round(paid*100),returned=0,totalCost=0;
 for(let k=0;k<pack;k++){
  const pieceTotal=Math.round(invoice.total*(k+1)/pack)-Math.round(invoice.total*k/pack);
  const refund=Math.min(refundLeft,pieceTotal);refundLeft-=refund;
  const returnedDoc=run(rep,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:1,unit:'piece'}],refund:refund/100});assert.equal(returnedDoc.status,'pending');run(admin,{action:'approve',id:returnedDoc.id});returned+=returnedDoc.total;totalCost+=returnedDoc.lines[0].cost;
 }
 assert.equal(returned,invoice.total);assert.equal(totalCost,invoice.lines[0].cost);assert.equal(s.customers[0].debt,0);assert.equal(s.cash.r||0,0);assert.equal(s.stocks.r[p],pack);
 assert.throws(()=>run(rep,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:1,unit:'piece'}],refund:0}));
 const returnCar=run(rep,{action:'carReturn',lines:[{productId:p,quantity:1,unit:'carton'}]});run(admin,{action:'approve',id:returnCar.id});assert.equal(s.stocks.warehouse[p],pack);assert.equal(s.stocks.r[p],0);
 assert.equal(s.cash.main,10000);assert.equal(s.ledger.reduce((n,l)=>n+l.amount,0),Object.values(s.cash).reduce((a,b)=>a+b,0));
 assert.equal(visible(s,other).documents.length,0);checks+=11;
}
// Admin-issued car invoice is visible and returnable by the car's representative.
const s=blank();apply(s,admin,{action:'product',name:'صنف',code:'A',pack:1,piecePrice:10,cartonPrice:10,cost:5},['r']);apply(s,admin,{action:'customer',name:'عميل',code:'A'},['r']);const p=s.products[0].id,c=s.customers[0].id;apply(s,admin,{action:'stock',repId:'r',productId:p,quantity:2,reason:'افتتاحي'},['r']);const invoice=apply(s,admin,{action:'sale',repId:'r',customerId:c,lines:[{productId:p,unit:'piece',quantity:1}],payment:'credit'},['r']);assert.throws(()=>apply(structuredClone(s),other,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,unit:'piece',quantity:1}],refund:0},['r','other']));const pendingReturn=apply(s,rep,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,unit:'piece',quantity:1}],refund:0},['r']);apply(s,admin,{action:'approve',id:pendingReturn.id},['r']);assert.equal(s.customers[0].debt,0);
const huge=blank();apply(huge,admin,{action:'product',name:'ضخم',code:'H',pack:1,piecePrice:100000000,cartonPrice:100000000,cost:1},[]);apply(huge,admin,{action:'customer',name:'عميل',code:'H'},[]);apply(huge,admin,{action:'stock',productId:huge.products[0].id,quantity:100000000,reason:'افتتاحي'},[]);assert.throws(()=>apply(huge,admin,{action:'sale',customerId:huge.customers[0].id,lines:[{productId:huge.products[0].id,quantity:100000000,unit:'piece'}],payment:'credit'},[]));assert.equal(huge.documents.filter(d=>d.type==='sale').length,0);
console.log('PASS: 100 carton/partial-payment/full-piece-return/car-emptying workflows; '+checks+' reconciliation assertions; own-car admin invoice returns, foreign invoice denial, numeric overflow prevention');

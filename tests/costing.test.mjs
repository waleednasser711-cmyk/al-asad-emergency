import assert from 'node:assert/strict';
import {blank,apply} from '../lib/business.ts';
import {createReports} from '../lib/reports.ts';
const a={id:'admin',name:'مدير',role:'admin'};let s=blank();const run=b=>apply(s,a,b,[]);
run({action:'product',name:'صنف',code:'P',pack:1,piecePrice:12,cartonPrice:12,cost:5});run({action:'customer',name:'عميل',code:'C'});run({action:'supplier',name:'مورد',code:'S'});const p=s.products[0].id,c=s.customers[0].id,v=s.suppliers[0].id;
run({action:'stock',productId:p,quantity:100,reason:'افتتاحي'});
const invoice=run({action:'sale',customerId:c,lines:[{productId:p,unit:'piece',quantity:20}],payment:'credit'});
run({action:'purchase',supplierId:v,lines:[{productId:p,unit:'piece',quantity:20,price:10}],paid:0});assert.equal(s.products[0].cost,600);
run({action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,unit:'piece',quantity:20}],refund:0});assert.equal(s.products[0].cost,583,'Old-cost sale returns blend into current average');assert.equal(s.customers[0].debt,0);assert.equal(createReports(s,[],{},'2026-10').profit().cost,0);
// Supplier return removes stock at current average. Price difference reconciles in operating results.
s=blank();run({action:'product',name:'صنف',code:'P',pack:1,piecePrice:12,cartonPrice:12,cost:5});run({action:'supplier',name:'مورد',code:'S'});const pp=s.products[0].id,vv=s.suppliers[0].id;run({action:'stock',productId:pp,quantity:100,reason:'افتتاحي'});
const purchase=run({action:'purchase',supplierId:vv,lines:[{productId:pp,unit:'piece',quantity:100,price:10}],paid:0});assert.equal(s.products[0].cost,750);const ret=run({action:'purchaseReturn',invoiceId:purchase.id,lines:[{productId:pp,unit:'piece',quantity:100}],refund:0});assert.equal(ret.total,100000);assert.equal(ret.lines[0].cost,75000);assert.equal(ret.inventoryAdjustment,25000);assert.equal(s.suppliers[0].debt,0);assert.equal(s.stocks.warehouse[pp],100);const report=createReports(s,[],{},'2026-10');assert.equal(report.profit().adjustments,25000);assert.equal(report.profit().net,25000);assert.equal(100*s.products[0].cost-report.profit().net,50000,'Inventory increase is reconciled by the return adjustment');
console.log('PASS: mixed-cost purchase average, old-cost sale returns, current-cost supplier return valuation and signed operating adjustment reconciliation');

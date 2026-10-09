import assert from 'node:assert/strict';
import {blank,apply} from '../lib/business.ts';
import {createReports} from '../lib/reports.ts';
const s=blank(),a={id:'admin',name:'مدير',role:'admin'},r={id:'r1',name:'مندوب',role:'rep'};
const run=b=>apply(s,a,b,['r1']);
run({action:'product',code:'A',name:'ألف',pack:10,piecePrice:10,cartonPrice:90,cost:5,minimum:4});
run({action:'product',code:'B',name:'باء',pack:6,piecePrice:20,cartonPrice:100,cost:12,minimum:0});
const [p,q]=s.products.map(p=>p.id);
run({action:'customer',code:'C',name:'عميل'});run({action:'supplier',code:'S',name:'مورد'});const c=s.customers[0].id,v=s.suppliers[0].id;
run({action:'cashOpening',amount:1000});run({action:'stock',productId:p,quantity:100,reason:'افتتاحي'});run({action:'stock',productId:q,quantity:20,reason:'افتتاحي'});
run({action:'load',repId:r.id,lines:[{productId:p,quantity:2,unit:'carton'},{productId:q,quantity:1,unit:'carton'}]});
const first=apply(s,r,{action:'sale',customerId:c,lines:[{productId:p,unit:'carton',quantity:1},{productId:q,unit:'piece',quantity:2}],payment:'credit',paid:30},['r1']);
const second=run({action:'sale',customerId:c,lines:[{productId:p,unit:'piece',quantity:3}],payment:'cash'});
apply(s,r,{action:'collection',customerId:c,amount:20},['r1']);
apply(s,r,{action:'saleReturn',invoiceId:first.id,lines:[{productId:p,unit:'piece',quantity:2}],refund:0},['r1']);run({action:'approve',id:s.documents.at(-1).id});
apply(s,r,{action:'deposit',amount:50,uploadId:'proof'},['r1']);run({action:'approve',id:s.documents.at(-1).id});
const purchase=run({action:'purchase',supplierId:v,lines:[{productId:q,unit:'piece',quantity:10,price:12}],paid:20});
run({action:'supplierPay',supplierId:v,amount:30});run({action:'purchaseReturn',invoiceId:purchase.id,lines:[{productId:q,unit:'piece',quantity:2}],refund:0});
run({action:'expense',amount:10,reason:'بنزين'});run({action:'target',repId:r.id,month:'2026-10',amount:200});
// Independent expected totals: sales 160, returns 18, cost 79, expenses 10.
// Normalize both creation and posting timestamps so the fixture stays fixed after Cairo midnight.
for(const arr of [s.documents,s.ledger,s.audit])for(const d of arr){d.at='2026-10-06T12:00:00Z';if(d.postedAt)d.postedAt=d.at;}
const report=createReports(s,[r],{},'2026-10');
assert.deepEqual(report.profit(),{sales:16000,returns:1800,netSales:14200,cost:7900,gross:6300,expenses:1000,adjustments:0,net:5300});
assert.deepEqual(report.repReport(),[['المخزن الرئيسي','1','30','0','30','15','0','—'],['مندوب','1','130','18','112','48','200','56٪']]);
assert.deepEqual(report.productReport(),[['ألف · A','13','2','11','102','55','47'],['باء · B','2','0','2','40','24','16']]);
assert.deepEqual(report.purchaseReport(),[['مورد','120','24','96','20','30','46']]);
assert.deepEqual(report.cashReport(),[['الخزنة الرئيسية','1,080','60','0','30','50','1,020'],['مندوب','50','50','20','30','50','0']]);
assert.deepEqual(report.inventoryReport(),[['ألف · A','المخزن الرئيسي','77','7','7','5','385'],['ألف · A','مندوب','12','1','2','5','60'],['باء · B','المخزن الرئيسي','22','3','4','12','264'],['باء · B','مندوب','4','0','4','12','48']]);
assert.deepEqual(report.balanceRows(),[['الخزنة الرئيسية','نقدية','1,020'],['مندوب','نقدية مندوب','0'],['عميل','مديونية عميل','62'],['مورد','مديونية مورد','46'],['قيمة المخزون الحالي','متوسط التكلفة','757']]);
assert.equal(report.auditRows().length,s.audit.length);assert.ok(report.auditRows().every(row=>!/\p{Script=Arabic}.*[٠-٩]/u.test(row[0])));
const byRep=createReports(s,[r],{reportRep:'r1'},'2026-10');assert.deepEqual(byRep.profit(),{sales:13000,returns:1800,netSales:11200,cost:6400,gross:4800,expenses:0,adjustments:0,net:4800});assert.equal(byRep.cashReport().length,1);assert.equal(byRep.inventoryReport().length,2);
const byProduct=createReports(s,[r],{reportProduct:p},'2026-10');assert.equal(byProduct.profit().net,4700);assert.equal(byProduct.productReport().length,1);assert.equal(byProduct.inventoryReport().length,2);
const both=createReports(s,[r],{reportProduct:p,reportRep:'r1'},'2026-10');assert.equal(both.profit().net,3200);
const none=createReports(s,[r],{from:'2026-10-07',to:'2026-10-08'},'2026-10');assert.equal(none.profit().net,0);assert.equal(none.auditRows().length,0);assert.equal(none.purchaseReport()[0][1],'0');assert.equal(none.balanceRows().at(-1)[2],'757','Current balances deliberately ignore historical date filters');
const boundary=createReports(s,[r],{from:'2026-10-07',to:'2026-10-07'},'2026-10');assert.equal(boundary.reportDates({at:'2026-10-06T21:00:00Z'}),true);assert.equal(boundary.reportDates({at:'2026-10-06T20:59:59Z'}),false);assert.equal(boundary.reportDates({at:'2026-10-07T21:00:00Z'}),false);
// Later price/cost edits must not rewrite historical profit.
s.products[0].piecePrice=9900;s.products[0].cost=9999;assert.equal(report.profit().net,5300);
console.log('PASS: all 9 report categories, hand-calculated sales/returns/cost/profit/cash/debt/inventory, rep/product/date filters, Cairo midnight, current balances, frozen invoice cost');

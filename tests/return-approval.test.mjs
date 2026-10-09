import assert from 'node:assert/strict';
import {blank,apply,visible} from '../lib/business.ts';
import {createReports} from '../lib/reports.ts';
import {customerAging,commissionFor,repDay,cairoDay} from '../lib/enhancements.ts';
import {validateBackup} from '../lib/backup.ts';
const admin={id:'admin',role:'admin',name:'مدير'},rep={id:'r',role:'rep',name:'مندوب'},other={id:'other',role:'rep',name:'آخر'},users=[admin,rep,other],ids=['r','other'];
let s=blank();const run=(actor,b)=>{const candidate=structuredClone(s);const doc=apply(candidate,actor,b,ids);s=candidate;return doc};
run(admin,{action:'product',code:'P',name:'صنف',pack:10,piecePrice:10,cartonPrice:90,cost:5});const p=s.products[0].id;
run(admin,{action:'customer',code:'C',name:'عميل'});const c=s.customers[0].id;
run(admin,{action:'stock',repId:'r',productId:p,quantity:40,reason:'افتتاحي'});
const invoice=run(rep,{action:'sale',customerId:c,lines:[{productId:p,quantity:1,unit:'carton'}],payment:'credit',paid:30});
const day=cairoDay(),month=day.slice(0,7);run(admin,{action:'commissionRule',repId:'r',month,base:'netSales',rate:10});
const finances=()=>({stocks:s.stocks,cash:s.cash,customers:s.customers,products:s.products,ledger:s.ledger,returned:s.documents.find(d=>d.id===invoice.id).returned});
const metrics=()=>({profit:createReports(s,[rep],{},month).profit(),products:createReports(s,[rep],{},month).productReport(),reps:createReports(s,[rep],{},month).repReport(),aging:customerAging(s,s.customers[0]),commission:commissionFor(s,'r',month),day:repDay(s,'r')});
let before=structuredClone(finances()),beforeMetrics=structuredClone(metrics());
const request={action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:2,unit:'piece'}],refund:0};
const pending=run(rep,request);assert.equal(pending.status,'pending');assert.deepEqual(finances(),before);assert.deepEqual(metrics(),beforeMetrics);
assert.equal(visible(s,other).documents.some(d=>d.id===pending.id),false);assert.equal(visible(s,rep).documents.find(d=>d.id===pending.id).lines[0].cost,undefined);
assert.throws(()=>run(rep,{action:'approve',id:pending.id}));assert.throws(()=>run(other,{action:'reject',id:pending.id,reason:'رفض'}));
assert.throws(()=>run(rep,request));assert.throws(()=>run(admin,request));assert.throws(()=>run(admin,{action:'reject',id:pending.id,reason:''}));
run(admin,{action:'reject',id:pending.id,reason:'اختبار رفض'});assert.deepEqual(finances(),before);assert.deepEqual(metrics(),beforeMetrics);assert.throws(()=>run(admin,{action:'approve',id:pending.id}));
const accepted=run(rep,request);run(admin,{action:'approve',id:accepted.id});const saved=s.documents.find(d=>d.id===accepted.id);
assert.equal(saved.status,'approved');assert.equal(saved.actorId,'r');assert.equal(saved.reviewedBy,'مدير');assert.ok(saved.postedAt);assert.equal(s.stocks.r[p],32);assert.equal(s.customers[0].debt,4200);assert.equal(s.cash.r,3000);assert.equal(s.documents.find(d=>d.id===invoice.id).returned[p],2);assert.equal(metrics().profit.returns,1800);assert.equal(metrics().commission.netSales,7200);assert.equal(metrics().day.saleReturns,1800);
assert.throws(()=>run(admin,{action:'approve',id:accepted.id}));assert.throws(()=>run(admin,{action:'reject',id:accepted.id,reason:'مرة أخرى'}));
// Approval must refuse changed debt without changing any financial values.
const stale=run(rep,{...request,lines:[{productId:p,unit:'piece',quantity:3}]});run(admin,{action:'debt',id:c,entity:'customer',mode:'set',amount:0,reason:'تعديل'});before=structuredClone(finances());assert.throws(()=>run(admin,{action:'approve',id:stale.id}));assert.deepEqual(finances(),before);assert.equal(s.documents.find(d=>d.id===stale.id).status,'pending');run(admin,{action:'reject',id:stale.id,reason:'المديونية تغيرت'});
// Cash is rechecked at approval too, including approval after a car deposit.
const paid=run(rep,{action:'sale',customerId:c,lines:[{productId:p,unit:'piece',quantity:2}],payment:'cash'});
const cashReturn=run(rep,{action:'saleReturn',invoiceId:paid.id,lines:[{productId:p,unit:'piece',quantity:2}],refund:20});
run(admin,{action:'deposit',repId:'r',amount:50,uploadId:'proof'});before=structuredClone(finances());assert.throws(()=>run(admin,{action:'approve',id:cashReturn.id}));assert.deepEqual(finances(),before);run(admin,{action:'reject',id:cashReturn.id,reason:'لا توجد نقدية'});
// Admin returns remain immediate; historical documents are not reclassified.
run(admin,{action:'debt',id:c,entity:'customer',mode:'add',amount:50,reason:'رصيد'});const immediate=run(admin,{...request,lines:[{productId:p,unit:'piece',quantity:1}]});assert.equal(immediate.status,'approved');assert.equal(s.customers[0].debt,4100);
assert.ok(validateBackup(s,users).documents.find(d=>d.id===accepted.id).postedAt);
const historic=structuredClone(s);historic.documents.find(d=>d.id===accepted.id).at='2026-01-01T12:00:00Z';assert.equal(createReports(historic,[rep],{from:day,to:day},month).profit().returns,2700,'Accounting follows approval date, not request date');
console.log('PASS: pending/rejected sale returns have zero financial/report/aging/commission/target/day effect; permissions, duplicate request/approval, live debt/cash checks, exact pricing/cost, historical admin returns, backup and approval-date reporting');

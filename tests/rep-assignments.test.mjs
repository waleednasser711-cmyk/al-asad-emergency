import assert from 'node:assert/strict';
import {blank,apply,visible} from '../lib/business.ts';
import {assignedToRep,customerAllowed,documentAllowed} from '../lib/rep-assignments.ts';
import {validateBackup} from '../lib/backup.ts';
import {createReports} from '../lib/reports.ts';
import {salePickerProducts} from '../lib/sale-picker-products.ts';

const admin={id:'admin',name:'المدير',role:'admin'},r1={id:'r1',name:'مندوب 1',role:'rep'},r2={id:'r2',name:'مندوب 2',role:'rep'},inactive={id:'inactive',name:'موقوف',role:'rep'};
const ids=['r1','r2'],allIds=[...ids,'inactive'];
let s=blank();
function run(actor,body){const next=structuredClone(s);const result=apply(next,actor,body,ids,allIds);s=next;return result;}
for(const code of ['A','B','C'])run(admin,{action:'customer',code,name:'عميل '+code});
for(const code of ['P','Q'])run(admin,{action:'product',code,name:'صنف '+code,pack:12,piecePrice:10,cartonPrice:100,cost:5,minimum:0});
const [a,b,c]=s.customers.map(x=>x.id),[p,q]=s.products.map(x=>x.id);
for(const productId of [p,q]){run(admin,{action:'stock',productId,quantity:100,reason:'اختبار'});run(admin,{action:'load',repId:r1.id,lines:[{productId,quantity:2,unit:'carton'}]});}
const invoice=run(r1,{action:'sale',customerId:a,lines:[{productId:p,quantity:2,unit:'piece'}],payment:'credit'});
const collection=run(r1,{action:'collection',customerId:a,amount:1});
const legacy=structuredClone(s);assert.equal(visible(s,r1).customers.length,3);assert.equal(visible(s,r2).customers.length,3);
const financial=structuredClone(s),profit=createReports(s,[],{},'2026-10').profit();
const restricted={action:'assignRep',repId:r1.id,customerIds:[b],productIds:[q]};
assert.throws(()=>run(r1,restricted),/الرئيسي/);
run(admin,restricted);
for(const key of ['stocks','cash','documents','ledger','targets','suppliers','settings'])assert.deepEqual(s[key],financial[key]);
assert.deepEqual(s.customers.map(({repIds,...x})=>x),financial.customers);
assert.deepEqual(s.products.map(({repIds,...x})=>x),financial.products);
assert.deepEqual(createReports(s,[],{},'2026-10').profit(),profit);
assert.equal(s.audit.at(-1).action,'assignRep');assert.equal(s.audit.at(-1).actorId,admin.id);assert.ok(s.audit.at(-1).at);
assert.deepEqual(s.audit.at(-1).customerIds,[b]);
assert.equal(customerAllowed(s,r1.id,a),false);assert.equal(customerAllowed(s,r2.id,a),true);assert.equal(customerAllowed(s,inactive.id,a),true);
assert.deepEqual(visible(s,r1).customers.map(x=>x.id),[b]);assert.equal(visible(s,r2).customers.length,3);
assert.equal(visible(s,r1).documents.some(x=>[invoice.id,collection.id].includes(x.id)),false);
assert.equal(documentAllowed(s,r1,invoice),false);assert.equal(documentAllowed(s,admin,invoice),true);
assert.equal(visible(s,r1).products.find(x=>x.id===p).saleAllowed,false);
assert.equal(visible(s,r1).stocks[r1.id][p],22,'Unassigned physical stock must remain accountable');
const r1View=visible(s,r1);assert.deepEqual(salePickerProducts(r1View.products,r1View.stocks,'sale',r1).map(x=>x.id),[q]);
assert.equal(r1View.customers.some(x=>'repIds' in x),false);assert.equal(r1View.products.some(x=>'repIds' in x||'cost' in x),false);
for(const body of [
 {action:'sale',customerId:a,lines:[{productId:q,quantity:1,unit:'piece'}],payment:'cash'},
 {action:'collection',customerId:a,amount:1},
 {action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:1,unit:'piece'}]},
 {action:'sale',customerId:b,lines:[{productId:p,quantity:1,unit:'piece'}],payment:'cash'},
 {action:'load',lines:[{productId:p,quantity:1,unit:'piece'}]},
]){const before=structuredClone(s);assert.throws(()=>run(r1,body),/غير مخصص/);assert.deepEqual(s,before);}
const carReturn=run(r1,{action:'carReturn',lines:[{productId:p,quantity:1,unit:'piece'}]});assert.equal(carReturn.status,'pending');run(admin,{action:'approve',id:carReturn.id});
run(admin,{action:'assignRep',repId:r2.id,customerIds:[a,b],productIds:[q]});
assert.equal(customerAllowed(s,r1.id,b),true);assert.equal(customerAllowed(s,r2.id,b),true);assert.equal(assignedToRep(s.products.find(x=>x.id===q),r1.id),true);assert.equal(assignedToRep(s.products.find(x=>x.id===q),r2.id),true);
const unchanged=structuredClone(s);
for(const body of [
 {...restricted,repId:'absent'},
 {...restricted,customerIds:[b,b]},
 {...restricted,customerIds:['missing']},
 {...restricted,productIds:['missing']},
 {...restricted,expected:{customerIds:[a,b,c],productIds:[p,q]}},
]){assert.throws(()=>run(admin,body));assert.deepEqual(s,unchanged);}
run(admin,{action:'assignRep',repId:r1.id,customerIds:[a,b],productIds:[q]});
assert.equal(visible(s,r1).documents.some(x=>x.id===invoice.id),true,'Reassignment restores historical access');
const pendingReturn=run(r1,{action:'saleReturn',invoiceId:invoice.id,lines:[{productId:p,quantity:1,unit:'piece'}]});assert.equal(pendingReturn.status,'pending','Historical return remains possible for assigned customer after product removal');
const request=run(r1,{action:'customerRequest',name:'عميل خاص',code:'NEW',repIds:[r2.id]});
assert.equal(s.customers.some(x=>x.id===request.customer.id),false);
run(admin,{action:'approve',id:request.id});
const fresh=s.customers.find(x=>x.id===request.customer.id);assert.deepEqual(fresh.repIds,[r1.id]);
assert.equal(visible(s,r1).customers.some(x=>x.id===fresh.id),true);assert.equal(visible(s,r2).customers.some(x=>x.id===fresh.id),false);
assert.equal(visible(s,r2).documents.some(x=>x.id===request.id),false);
const privateBefore=structuredClone(s);assert.throws(()=>run(r2,{action:'collection',customerId:fresh.id,amount:1}),/غير مخصص/);assert.deepEqual(s,privateBefore);
run(admin,{action:'assignRep',repId:r2.id,customerIds:[a,b,fresh.id],productIds:[q]});assert.equal(customerAllowed(s,r2.id,fresh.id),true);
const users=[admin,r1,r2,inactive];assert.deepEqual(validateBackup(s,users),JSON.parse(JSON.stringify(s)));
assert.deepEqual(validateBackup(legacy,users),JSON.parse(JSON.stringify(legacy)));
for(const repIds of [['unknown'],['admin'],[r1.id,r1.id]]){const corrupt=structuredClone(s);corrupt.customers[0].repIds=repIds;assert.throws(()=>validateBackup(corrupt,users));}
run(admin,{action:'import',kind:'customers',rows:[{code:'A',name:'اسم محدث'}]});assert.equal(customerAllowed(s,r1.id,a),true);
run(admin,{action:'assignRep',repId:r1.id,customerIds:[],productIds:[]});assert.equal(visible(s,r1).customers.length,0);assert.equal(salePickerProducts(visible(s,r1).products,visible(s,r1).stocks,'sale',r1).length,0);
assert.equal(customerAllowed(s,r2.id,a),true);assert.strictEqual(visible(s,admin),s);
console.log('PASS: legacy access, multi-rep assignments, admin-only validation and audit, nonmutating financial/report state, revoked customer history/sales/collections/returns, product/stock safety, exclusive approved customer requests, reassignment, stale edits and legacy/new backup preservation');

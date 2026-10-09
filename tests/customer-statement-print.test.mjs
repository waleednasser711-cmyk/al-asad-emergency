import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blank,apply,visible} from '../lib/business.ts';
import {validateBackup} from '../lib/backup.ts';
import {accountStatement} from '../lib/statements.ts';
import {printableDocument,printableStatement,documentLabels} from '../lib/print-documents.ts';
const admin={id:'admin',role:'admin',name:'مدير'},rep={id:'rep',role:'rep',name:'مندوب'},other={id:'other',role:'rep',name:'آخر'},users=[admin,rep,other];
let s=blank();const run=(a,b)=>{const candidate=structuredClone(s);const d=apply(candidate,a,b,['rep','other']);s=candidate;return d;};
const finance=()=>Object.fromEntries(['stocks','cash','customers','suppliers','products','ledger','targets','commissionRules'].map(k=>[k,s[k]]));
const before=structuredClone(finance());const req=run(rep,{action:'customerRequest',name:'  عميل جديد ',code:' CNEW ',phone:'010123',address:'عنوان',debt:99999,creditLimit:999,creditEnabled:true});
assert.equal(req.status,'pending');assert.equal(req.customer.name,'عميل جديد');assert.deepEqual(finance(),before);assert.equal(s.customers.length,0);assert.equal(visible(s,rep).documents.length,1);assert.equal(visible(s,other).documents.length,0);assert.ok(s.audit.some(x=>x.action==='customerRequest'&&x.actorId==='rep'));
assert.throws(()=>run(rep,{action:'customerRequest',name:'x',code:'CNEW'}));assert.throws(()=>run(other,{action:'customerRequest',name:'x',code:'CNEW'}));assert.throws(()=>run(rep,{action:'customer',name:'x',code:'x'}));assert.throws(()=>run(admin,{action:'customerRequest',name:'x',code:'x'}));assert.throws(()=>run(rep,{action:'customerRequest',id:req.customer.id,name:'x',code:'x'}));
assert.throws(()=>run(rep,{action:'sale',customerId:req.customer.id,lines:[],payment:'cash'}));assert.throws(()=>run(rep,{action:'collection',customerId:req.customer.id,amount:1}));assert.throws(()=>run(rep,{action:'approve',id:req.id}));assert.throws(()=>run(other,{action:'reject',id:req.id,reason:'x'}));assert.throws(()=>run(rep,{action:'customerRequest',name:' ',code:'X'}));
assert.deepEqual(validateBackup(s,users).documents,s.documents);const corrupt=structuredClone(s);delete corrupt.documents[0].customer;assert.throws(()=>validateBackup(corrupt,users));
run(admin,{action:'reject',id:req.id,reason:'بيانات ناقصة'});assert.deepEqual(finance(),before);assert.equal(s.customers.length,0);const accepted=run(rep,{action:'customerRequest',name:'عميل جديد',code:'CNEW'});run(admin,{action:'approve',id:accepted.id});assert.equal(s.customers.length,1);assert.equal(s.customers[0].id,accepted.customer.id);assert.equal(s.customers[0].debt,0);assert.equal(s.customers[0].creditEnabled,false);assert.equal(s.documents.at(-1).reviewedBy,'مدير');assert.throws(()=>run(admin,{action:'approve',id:accepted.id}));assert.throws(()=>run(rep,{action:'customerRequest',name:'x',code:'CNEW'}));assert.deepEqual(validateBackup(s,users).customers,s.customers);
const clash=run(rep,{action:'customerRequest',name:'x',code:'CLASH'});run(admin,{action:'customer',name:'admin x',code:'CLASH'});assert.throws(()=>run(admin,{action:'approve',id:clash.id}));assert.equal(s.documents.find(d=>d.id===clash.id).status,'pending');assert.equal(s.customers.filter(c=>c.code==='CLASH').length,1);
console.log('PASS: pending/rejected customers do not enter active list or finances; duplicate codes, rep/admin permission, sanitized data, audit, exactly-once approval, live code clash and old/new backup validation');
// Exact cent values and Cairo boundaries, including approval date and legacy debt.
const at=day=>day+'T12:00:00.000Z';const fixture={...blank(),customers:[{id:'c',name:'<script>alert(1)</script>',code:'C',phone:'010',address:'addr',debt:4750}],suppliers:[{id:'v',name:'مورد',code:'V',debt:1500}],documents:[
{id:'a',number:1,type:'sale',customerId:'c',at:at('2026-10-01'),total:10000,paid:3000,lines:[{name:'<img src=x onerror=x>',quantity:10,unit:'piece',price:1000,total:10000,cost:8888}]},
{id:'b',number:2,type:'collection',customerId:'c',at:at('2026-10-02'),amount:2000},
{id:'p',number:3,type:'saleReturn',customerId:'c',at:at('2026-10-02'),status:'pending',total:1000,refund:0},
{id:'r',number:4,type:'saleReturn',customerId:'c',at:at('2026-10-01'),postedAt:at('2026-10-03'),status:'approved',total:3000,refund:500,originalNumber:1},
{id:'d',number:5,type:'debt',entity:'customer',customerId:'c',at:at('2026-10-04'),before:3000,after:2750,reason:'تصحيح'},
{id:'cash',number:6,type:'sale',customerId:'c',at:'2026-10-04T21:30:00.000Z',total:500,paid:500},
{id:'x',number:7,type:'sale',customerId:'foreign',at:at('2026-10-03'),total:999999,paid:0},
{id:'s',number:8,type:'purchase',supplierId:'v',at:at('2026-10-01'),total:2000,paid:300},
{id:'pay',number:9,type:'supplierPay',supplierId:'v',at:at('2026-10-02'),amount:200},
{id:'sr',number:10,type:'purchaseReturn',customerId:'v',at:at('2026-10-03'),total:500,refund:100},
{id:'sd',number:11,type:'debt',customerId:'v',entity:'supplier',at:at('2026-10-04'),before:1100,after:1500},
{id:'stock',number:12,type:'stock',customerId:'c',at:at('2026-10-02'),before:0,after:9000},
{id:'rejected',number:13,type:'saleReturn',customerId:'c',at:at('2026-10-02'),status:'rejected',total:8000,refund:0}
]};
const untouched=structuredClone(fixture);let st=accountStatement(fixture,'c');assert.equal(st.opening,2500);assert.equal(st.closing,4750);assert.equal(st.current,4750);assert.deepEqual(st.rows.map(r=>r.id),['a','b','r','d','cash']);assert.equal(st.totalDebit,11000);assert.equal(st.totalCredit,8750);assert.equal(st.rows[0].lines[0].cost,undefined);assert.equal(st.rows[0].actorId,undefined);
st=accountStatement(fixture,'c','customer','2026-10-02','2026-10-03');assert.equal(st.opening,9500);assert.equal(st.closing,5000);assert.deepEqual(st.rows.map(r=>r.id),['b','r']);assert.equal(st.rows[1].debit,500);assert.equal(st.rows[1].credit,3000);
st=accountStatement(fixture,'c','customer','2026-10-04','2026-10-04');assert.deepEqual(st.rows.map(r=>r.id),['d']);assert.equal(st.opening,5000);assert.equal(st.closing,4750);
st=accountStatement(fixture,'c','customer','2026-10-06','2026-10-07');assert.equal(st.rows.length,0);assert.equal(st.opening,4750);assert.equal(st.closing,4750);
st=accountStatement(fixture,'c','customer','','2026-09-30');assert.equal(st.rows.length,0);assert.equal(st.closing,2500);
st=accountStatement(fixture,'v','supplier');assert.equal(st.opening,0);assert.equal(st.closing,1500);assert.deepEqual(st.rows.map(r=>r.id),['s','pay','sr','sd']);
for(const [entity,from,to,id] of [['customer','2026-02-30','','c'],['customer','garbage','','c'],['customer','2026-10-05','2026-10-01','c'],['wrong','','','c'],['customer','','','missing']])assert.throws(()=>accountStatement(fixture,id,entity,from,to));assert.deepEqual(fixture,untouched);
const html=printableStatement(accountStatement(fixture,'c'),{name:'شركة الأسد',phone:'010',address:'addr'});assert.match(html,/الرصيد الافتتاحي: 25/);assert.match(html,/الرصيد الختامي للفترة: 47.5/);assert.match(html,/دائن \/ مدفوع/);assert.match(html,/تحصيل عميل/);assert.match(html,/مرتجع بيع/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<img src=x|88.88|٩/);
for(const type of Object.keys(documentLabels)){const h=printableDocument({type,number:14,at:at('2026-10-01'),actorName:'<script>x</script>',status:'pending',amount:1250,note:'<b>ملاحظة</b>',uploadId:'safe',customer:{name:'x',code:'C',phone:'1',address:'عنوان'},lines:[{name:'صنف',code:'P',quantity:2,unit:'carton',pieces:24,price:1200,total:2400}]},{name:'شركة الأسد'},'المخزن');assert.match(h,new RegExp(documentLabels[type]));assert.match(h,/بانتظار الاعتماد/);assert.match(h,/12.5/);assert.match(h,/&lt;script&gt;/);assert.doesNotMatch(h,/<script>|<b>ملاحظة/);}
const dayHtml=printableDocument({type:'dayClose',number:1,at:at('2026-10-01'),summary:{sales:1500,saleReturns:500,invoices:2,products:[{name:'صنف',loaded:2,sold:1,returned:0,toWarehouse:0,current:1}]}},{name:'الأسد'},'مندوب');assert.match(dayHtml,/عدد الفواتير: 2/);assert.match(dayHtml,/المرتجعات/);assert.match(dayHtml,/رصيد وقت الإقفال/);
// Static theme and integration checks are separate from actual browser/hardware QA.
const css=readFileSync('app/globals.css','utf8'),page=readFileSync('app/page.tsx','utf8');assert.match(css,/@media screen/);assert.match(css,/--background:#0b1420/);assert.match(css,/\.receipt-paper\{color-scheme:light/);assert.match(page,/printableStatement\(statementData/);assert.match(page,/disabled=\{!statementReady\}/);assert.match(page,/طلب إضافة عميل/);assert.equal((page.match(/<h2>طلبات إضافة العملاء<\/h2>/g)||[]).length,1);
const lum=hex=>hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);for(const [fg,bg] of [['edf4fc','172638'],['b3c3d5','172638'],['edf4fc','101e2d'],['ffd78a','3b2e16'],['a4ecd0','113b32'],['ffb6c4','421f2b']])assert.ok((lum(fg)+.05)/(lum(bg)+.05)>=4.5);
console.log('PASS: complete account statements reconcile exact cents and legacy opening debt, cash/credit/returns/collections/adjustments, supplier parity, Cairo inclusive periods and empty periods; sanitized printable HTML for every document, Latin digits, dark-theme text contrast and unchanged source state');

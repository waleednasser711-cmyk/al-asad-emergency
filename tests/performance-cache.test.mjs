import assert from 'node:assert/strict';
import {blank} from '../lib/business.ts';
import {createReports} from '../lib/reports.ts';
import {createCachedReports} from '../lib/report-cache.ts';
import {createSyncClock} from '../lib/sync-clock.ts';
const s=blank(),reps=[{id:'r',name:'مندوب'}];
s.products=[{id:'p',name:'صنف',code:'P',pack:12,cost:500,minimum:0}];s.stocks={warehouse:{p:24},r:{p:6}};
s.documents=[{id:'d',number:1,type:'sale',status:'approved',at:'2026-10-07T10:00:00Z',location:'r',total:1000,paid:1000,lines:[{productId:'p',pieces:1,total:1000,cost:500}]}];
const saved=JSON.stringify(s);
for(const form of [{},{reportRep:'warehouse'},{reportRep:'r',reportProduct:'p'},{from:'2026-10-08'},{to:'2026-10-06'}]){
 const uncached=createReports(s,reps,form,'2026-10'),cached=createCachedReports(s,reps,form,'2026-10');
 for(const key of ['profit','profitRows','repReport','productReport','purchaseReport','cashReport','inventoryReport','balanceRows','auditRows']){assert.deepEqual(cached[key](),uncached[key]());assert.strictEqual(cached[key](),cached[key]());}
 assert.equal(cached.reportDates(s.documents[0]),uncached.reportDates(s.documents[0]));
}
assert.equal(JSON.stringify(s),saved);
const old=createCachedReports(s,reps,{},'2026-10'),prior=old.inventoryReport();
const next=structuredClone(s);next.stocks.warehouse.p=36;
assert.notDeepEqual(createCachedReports(next,reps,{},'2026-10').inventoryReport(),prior);
assert.notDeepEqual(createCachedReports(s,reps,{reportRep:'r'},'2026-10').inventoryReport(),prior);
const clock=createSyncClock();let notices=0;const stop=clock.subscribe(()=>notices++);
clock.publish('19:00:01');assert.equal(clock.getSnapshot(),'19:00:01');assert.equal(notices,1);
clock.publish('19:00:01');assert.equal(notices,1);clock.publish('19:00:02');assert.equal(notices,2);stop();clock.publish('19:00:03');assert.equal(notices,2);
assert.equal(JSON.stringify(s),saved);
console.log('PASS: cached results match every report/filter, same-snapshot reuse, fresh state/filter invalidation, nonmutation and isolated sync-clock subscriptions');

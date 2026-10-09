import assert from 'node:assert/strict';
import {buildRepProductSales,accountProductSales} from '../lib/rep-product-sales.ts';
import {projectSales} from '../lib/offline-sales.ts';
import {visible,blank} from '../lib/business.ts';
const products=[{id:'p',code:'2001',name:'صنف',pack:4,repIds:['r']}];
const line=(pieces,total)=>({productId:'p',code:'2001',name:'صنف',unit:'piece',quantity:pieces,pieces,total,cost:999});
const doc=(type,pieces,total,extra={})=>({id:'private-invoice',customerId:'private-client',location:'r',type,at:'2026-10-08T20:00:00Z',total,lines:[line(pieces,total)],...extra});
const documents=[doc('sale',13,1300),doc('saleReturn',2,200,{postedAt:'2026-10-09T01:00:00Z'}),doc('saleReturn',4,400,{status:'pending'}),doc('saleReturn',4,400,{status:'rejected'}),doc('sale',50,5000,{location:'other'})];
const state={...blank(),products,documents},original=structuredClone(state);
const summary=buildRepProductSales(documents,products,'r');
const row=accountProductSales({...state,repProductSales:summary},'r')[0];
assert.equal(row.soldPieces,13);assert.equal(row.returnedPieces,2);assert.equal(row.netPieces,11);assert.equal(row.netSales,1100);assert.equal(row.pack,4);
assert.equal(accountProductSales(state,'r','2026-10-08','2026-10-08')[0].netSales,1300);
assert.equal(accountProductSales(state,'r','2026-10-09','2026-10-09')[0].netSales,-200);
assert.deepEqual(state,original);
for(const secret of ['private-client','private-invoice','cost','other'])assert.equal(JSON.stringify(summary).includes(secret),false);
// Revoked customer invoices remain hidden, but own product totals still reconcile.
const projected=visible(state,{id:'r',name:'مندوب',role:'rep'});
assert.equal(projected.documents.length,0);
assert.equal(accountProductSales(projected,'r')[0].netSales,projected.salesAccounting.days['2026-10-08'].sales-projected.salesAccounting.days['2026-10-09'].returns);
const data={user:{id:'r',role:'rep'},state:projected},q={id:'local',actorId:'r',receipt:doc('sale',3,300,{id:'local',paid:300})};
const local=projectSales(data,[q]);
assert.equal(accountProductSales(local.state,'r')[0].netSales,1400);
assert.equal(accountProductSales(projectSales({...data,syncedSaleIds:['local']},[q]).state,'r')[0].netSales,1100);
assert.equal(accountProductSales(data.state,'r')[0].netSales,1100);
// Older offline caches derive totals from their available documents.
assert.equal(accountProductSales(projectSales({user:data.user,state},[]).state,'r')[0].netSales,1100);
console.log('PASS: rep product sales, approved returns, dates, privacy and offline deduplication');

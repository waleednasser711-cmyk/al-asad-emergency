import assert from 'node:assert/strict';
import {salePickerProducts} from '../lib/sale-picker-products.ts';

const products=[{id:'piece',pack:12},{id:'carton',pack:6},{id:'zero'},{id:'missing'},{id:'other'}];
const stocks={warehouse:{zero:50,missing:20,other:30},r1:{piece:1,carton:12,zero:0},r2:{other:10}};
const rep={id:'r1',role:'rep'},admin={id:'admin',role:'admin'};
const before=JSON.stringify({products,stocks});
assert.deepEqual(salePickerProducts(products,stocks,'sale',rep),[products[0],products[1]]);
assert.deepEqual(salePickerProducts(products,stocks,'sale',{id:'r2',role:'rep'}),[products[4]]);
assert.deepEqual(salePickerProducts(products,stocks,'sale',{id:'empty',role:'rep'}),[]);
assert.equal(JSON.stringify({products,stocks}),before);
assert.strictEqual(salePickerProducts(products,stocks,'sale',admin),products);
for(const kind of ['purchase','carReturn','saleReturn','purchaseReturn']){
 assert.strictEqual(salePickerProducts(products,stocks,kind,rep),products);
 assert.strictEqual(salePickerProducts(products,stocks,kind,admin),products);
}
const next=structuredClone(stocks);next.r1.piece=0;next.r1.zero=1;
assert.deepEqual(salePickerProducts(products,next,'sale',rep),[products[1],products[2]]);
assert.equal(JSON.stringify({products,stocks}),before);
// Rep load: preserve legacy permissions and show zero-car-stock assigned products.
const loadProducts=[{id:'legacy',assignedToCurrentRep:false},{id:'assigned',assignedToCurrentRep:true},{id:'revoked',saleAllowed:false,assignedToCurrentRep:false}];
const loadStocks={warehouse:{legacy:12,assigned:30,revoked:10},r1:{revoked:4}};
const loadBefore=JSON.stringify({loadProducts,loadStocks});
assert.deepEqual(salePickerProducts(loadProducts,loadStocks,'load',rep),loadProducts.slice(0,2));
assert.deepEqual(salePickerProducts(loadProducts,loadStocks,'sale',rep),[]);
assert.strictEqual(salePickerProducts(loadProducts,loadStocks,'load',admin),loadProducts);
assert.equal(JSON.stringify({loadProducts,loadStocks}),loadBefore);
const {blank,apply,visible}=await import('../lib/business.ts');
const state=blank();state.products=[{id:'legacy',name:'صنف قديم',code:'OLD',pack:6,piecePrice:100,cartonPrice:600,cost:50}];state.stocks.warehouse.legacy=12;
const beforeLoad=structuredClone(state),projected=visible(state,rep),choice=salePickerProducts(projected.products,projected.stocks,'load',rep)[0];
assert.equal(choice.id,'legacy');assert.equal(choice.assignedToCurrentRep,false);
const request=apply(state,rep,{action:'load',lines:[{productId:choice.id,unit:'carton',quantity:1}]},['r1']);
assert.equal(request.status,'pending');for(const key of ['stocks','cash','customers','products','ledger'])assert.deepEqual(state[key],beforeLoad[key]);
console.log('PASS: rep loading includes allowed legacy/assigned products without car stock, excludes revoked stock/history products, creates a pending request without financial changes; admin and sale picker preserved');
console.log('PASS: rep sale picker uses own positive piece balance, excludes zero/missing/other locations, updates after depletion/loading, preserves admin/other document choices and does not mutate data');

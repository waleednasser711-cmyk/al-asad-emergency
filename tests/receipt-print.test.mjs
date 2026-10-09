import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {receiptPrintHtml,printThermalReceipt} from '../lib/receipt-print.ts';
const markup='<article class="receipt-paper" style="max-width:104mm"><h2>شركة الأسد</h2><table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody><tr><td>صنف طويل &lt;script&gt;</td><td>1 كرتونة</td><td>285</td><td>285</td></tr></tbody></table><div class="receipt-total">الإجمالي 285</div></article>';
for(const width of [58,80,104]){const html=receiptPrintHtml(markup,width);assert.ok(html.includes(`data-receipt-width="${width}"`));assert.ok(html.includes(`size:${width}mm 200mm`));assert.ok(html.includes(markup));assert.match(html,/table-layout:fixed/);assert.match(html,/position:static/);assert.doesNotMatch(html,/visibility:hidden|translate|dialog/);}
assert.match(receiptPrintHtml(markup,'bad'),/data-receipt-width="104"/);
let printed=0,removed=0,error=0,frame;
global.document={createElement:()=>{frame={style:{},remove:()=>removed++,contentWindow:{document:{body:{dataset:{receiptWidth:'104'},getBoundingClientRect:()=>({height:756})},fonts:{ready:Promise.resolve()},createElement:()=>({}),head:{appendChild:s=>assert.equal(s.textContent,'@page{size:104mm 203mm;margin:0}')}},requestAnimationFrame:f=>f(),addEventListener:()=>{},focus:()=>{},print:()=>printed++}};return frame;},body:{appendChild:()=>{}}};
const originalTimer=global.setTimeout;global.setTimeout=()=>0;
printThermalReceipt(markup,104,()=>error++);assert.ok(frame.srcdoc.includes(markup));await frame.onload();assert.equal(printed,1);assert.equal(frame.style.width,'104mm');assert.equal(error,0);
printThermalReceipt(markup,80,()=>error++);frame.contentWindow=null;await frame.onload();assert.equal(printed,1);assert.equal(removed,1);assert.equal(error,1);global.setTimeout=originalTimer;
const page=readFileSync('app/page.tsx','utf8');assert.match(page,/if\(admin\)\{window.print\(\);return;\}/);assert.match(page,/printThermalReceipt\(paper.outerHTML,s.settings.paper/);
console.log('PASS: receipt-only markup preserves all columns/totals, bounded 58/80/104mm layout, measured page height, iframe printing and cleanup/error path, main-account print path retained. Physical Android/RawBT output requires device verification.');

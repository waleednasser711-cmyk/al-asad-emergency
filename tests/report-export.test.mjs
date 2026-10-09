import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {blank,apply} from '../lib/business.ts';
import {createReports} from '../lib/reports.ts';
import {buildReportExport,reportWorkbook,printableReport,reportTitles} from '../lib/report-export.ts';
import {documentLabels} from '../lib/print-documents.ts';
const a={id:'admin',name:'المدير',role:'admin'},rep={id:'rep',name:'مندوب 001',role:'rep'},reps=[rep];const s=blank(),run=b=>apply(s,a,b,['rep']);
s.settings.name='شركة الأسد <script>alert(1)</script>';
run({action:'product',name:'صنف عربي',code:'0001',pack:12,piecePrice:12.34,cartonPrice:140.01,cost:3,minimum:0});const p=s.products[0].id;
run({action:'customer',name:'=SUM(A1:A2)',code:'0005'});const c=s.customers[0].id;
run({action:'supplier',name:'مورد',code:'0009'});const v=s.suppliers[0].id;
run({action:'stock',quantity:200,productId:p,reason:'اختبار'});run({action:'cashOpening',amount:2000});
const sale=run({action:'sale',customerId:c,lines:[{productId:p,unit:'piece',quantity:100}],payment:'credit',paid:0});
run({action:'purchase',supplierId:v,lines:[{productId:p,unit:'piece',quantity:5,price:4}],paid:10});
run({action:'target',repId:'rep',month:'2026-10',amount:100});
s.targets['2026-10'].warehouse=100000;
const original=structuredClone(s),r=createReports(s,reps,{},'2026-10',documentLabels);
const expected={profit:r.profitRows(),reps:r.repReport(),products:r.productReport(),purchases:r.purchaseReport(),cash:r.cashReport(),inventory:r.inventoryReport(),balances:r.balanceRows(),audit:r.auditRows()};
for(const tab of Object.keys(reportTitles)){
 const report=buildReportExport(s,reps,{},'2026-10',tab,documentLabels);assert.equal(report.title,reportTitles[tab]);if(expected[tab])assert.deepEqual(report.rows,expected[tab]);
 const wb=reportWorkbook(XLSX,report),bytes=XLSX.write(wb,{type:'buffer',bookType:'xlsx'}),actual=XLSX.read(bytes,{type:'buffer',cellNF:true});
 assert.deepEqual(actual.SheetNames,['التقرير','بيانات التقرير']);assert.equal(actual.Workbook.Views[0].RTL,true);
 const rows=XLSX.utils.sheet_to_json(actual.Sheets['التقرير'],{header:1,defval:''});assert.deepEqual(rows[0],report.heads);assert.equal(rows.length,report.rows.length+1);
 for(let i=0;i<report.rows.length;i++)for(let j=0;j<report.heads.length;j++){const cell=actual.Sheets['التقرير'][XLSX.utils.encode_cell({r:i+1,c:j})];assert.equal(cell?.f,undefined);if(report.numericColumns.includes(j)){assert.equal(typeof rows[i+1][j],'number');assert.equal(rows[i+1][j],Number(String(report.rows[i][j]).replaceAll(',','')))}else if(!report.percentColumns.includes(j))assert.equal(rows[i+1][j],String(report.rows[i][j]??''))}
 const html=printableReport(report);assert.match(html,/dir="rtl"/);assert.match(html,/@page\{size:A4/);assert.match(html,/display:table-header-group/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.ok(html.includes(report.title));assert.equal((html.match(/<tbody>/g)||[]).length,1);
}
const profits=reportWorkbook(XLSX,buildReportExport(s,reps,{},'2026-10','profit',documentLabels));assert.equal(profits.Sheets['التقرير'].B2.v,1234);assert.equal(profits.Sheets['التقرير'].B2.t,'n');assert.equal(profits.Sheets['التقرير'].B2.z,'#,##0.00');
const repSheet=reportWorkbook(XLSX,buildReportExport(s,reps,{},'2026-10','reps',documentLabels)).Sheets['التقرير'];assert.equal(repSheet.H2.v,1.23);assert.equal(repSheet.H2.z,'0%');
const balanceSheet=reportWorkbook(XLSX,buildReportExport(s,reps,{},'2026-10','balances',documentLabels)).Sheets['التقرير'];assert.equal(balanceSheet.A4.v,'=SUM(A1:A2)');assert.equal(balanceSheet.A4.t,'s');assert.equal(balanceSheet.A4.f,undefined);
const old={from:'2000-01-01',to:'2000-01-02'};
assert.deepEqual(buildReportExport(s,reps,old,'2026-10','products',documentLabels).rows,createReports(s,reps,old,'2026-10').productReport());
for(const tab of ['balances','inventory']){const result=buildReportExport(s,reps,old,'2026-10',tab,documentLabels);assert.deepEqual(result.rows,buildReportExport(s,reps,{},'2026-10',tab,documentLabels).rows);assert.match(result.metadata.find(([key])=>key==='الفترة')[1],/الوضع الحالي/)}
const filtered=buildReportExport(s,reps,{reportProduct:p,reportRep:'warehouse'},'2026-10','products',documentLabels);assert.equal(filtered.rows.length,1);assert.equal(filtered.rows[0][4],'1,234');
const movements=buildReportExport(s,reps,{},'2026-10','movements',documentLabels,'فاتورة بيع');assert.equal(movements.rows.length,1);assert.equal(movements.rows[0][0],sale.number);assert.equal(movements.rows[0][3],'=SUM(A1:A2)');assert.equal(movements.rows[0][5],'معتمد');
const empty=buildReportExport(s,reps,old,'2026-10','movements',documentLabels);assert.equal(empty.rows.length,0);assert.match(printableReport(empty),/لا توجد بيانات/);
assert.deepEqual(s,original);
console.log('PASS: all 9 report export tables match calculations, real XLSX write/read with Arabic RTL/numeric money/percent/text-code safety, PDF print layout and escaping, current-balance/date/product/rep/search semantics and unchanged business state');

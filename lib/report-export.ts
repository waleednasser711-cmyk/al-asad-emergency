import {createReports} from './reports.ts';
import {date,fmt} from './format.ts';
import {documentAt} from './document-status.ts';
import type {State} from './business.ts';
export const reportTitles:Record<string,string>={profit:'أرباح وخسائر',reps:'مبيعات المناديب',products:'مبيعات الأصناف',purchases:'مشتريات الموردين',cash:'النقدية والتحصيل',inventory:'المخزون',balances:'الأرصدة والمديونيات',movements:'المستندات',audit:'سجل التعديلات'};
export type ReportExport={title:string;heads:string[];rows:any[][];numericColumns:number[];moneyColumns:number[];percentColumns:number[];metadata:string[][]};
export function buildReportExport(s:State,reps:any[],form:any,month:string,tab:string,labels:Record<string,string>,search=''):ReportExport {
 const r=createReports(s,reps,form,month,labels);let heads:string[]=[],rows:any[][]=[],numericColumns:number[]=[],moneyColumns:number[]=[],percentColumns:number[]=[];
 switch(tab){
 case 'profit':heads=['البند','القيمة (ج.م)'];rows=r.profitRows();numericColumns=[1];moneyColumns=[1];break;
 case 'reps':heads=['المندوب','الفواتير','المبيعات','المرتجعات','صافي المبيعات','مجمل الربح','التارجت الحالي','تحقيق الشهر'];rows=r.repReport();numericColumns=[1,2,3,4,5,6];moneyColumns=[2,3,4,5,6];percentColumns=[7];break;
 case 'products':heads=['الصنف / الكود','قطع مباعة','قطع مرتجعة','صافي القطع','صافي المبيعات','تكلفة البضاعة','مجمل الربح'];rows=r.productReport();numericColumns=[1,2,3,4,5,6];moneyColumns=[4,5,6];break;
 case 'purchases':heads=['المورد','المشتريات','المرتجعات','صافي المشتريات','مدفوع بالمشتريات','دفعات سداد','المديونية الحالية'];rows=r.purchaseReport();numericColumns=[1,2,3,4,5,6];moneyColumns=[1,2,3,4,5,6];break;
 case 'cash':heads=['الحساب','داخل بالفترة','خارج بالفترة','تحصيل عملاء','بيع نقدي','توريد مندوب','رصيد حالي'];rows=r.cashReport();numericColumns=[1,2,3,4,5,6];moneyColumns=[1,2,3,4,5,6];break;
 case 'inventory':heads=['الصنف','الموقع','القطع','كرتون كامل','قطع متبقية','تكلفة القطعة','قيمة المخزون'];rows=r.inventoryReport();numericColumns=[2,3,4,5,6];moneyColumns=[5,6];break;
 case 'balances':heads=['الحساب','النوع','الرصيد / المديونية (ج.م)'];rows=r.balanceRows();numericColumns=[2];moneyColumns=[2];break;
 case 'audit':heads=['التاريخ','المستخدم','العملية','التفاصيل'];rows=r.auditRows();break;
 case 'movements':heads=['الرقم','التاريخ','النوع','الحساب / العميل','القيمة (ج.م)','الحالة'];rows=s.documents.filter(r.reportDates).filter(d=>!search||[d.name,d.code,d.customerName,d.supplierName,d.number,d.actorName,d.customer?.code,labels[d.type]].join(' ').toLowerCase().includes(search.toLowerCase())).slice().reverse().map(d=>[d.number,date(documentAt(d)),labels[d.type]||d.type,d.customerName||d.supplierName||((d.repId||d.location)==='warehouse'?'المخزن الرئيسي':reps.find(u=>u.id===(d.repId||d.location))?.name||'مندوب'),fmt(d.total||d.amount||0),({approved:'معتمد',pending:'بانتظار الاعتماد',rejected:'مرفوض'} as Record<string,string>)[d.status]||d.status]);numericColumns=[0,4];moneyColumns=[4];break;
 default:throw new Error('التقرير غير معروف');
 }
 const current=['inventory','balances'].includes(tab),metadata=[['الشركة',s.settings.name],['التقرير',reportTitles[tab]],['العملة','الجنيه المصري'],['الفترة',current?'الوضع الحالي — لا يتأثر بالفترة المختارة':(form.from||'من البداية')+' — '+(form.to||'حتى آخر حركة')]];
 if(['profit','reps','products','cash','inventory'].includes(tab))metadata.push(['المندوب / الموقع',!form.reportRep||form.reportRep==='all'?'الكل':form.reportRep==='warehouse'?'المخزن الرئيسي':reps.find(u=>u.id===form.reportRep)?.name||'مندوب']);
 if(['profit','reps','products','inventory'].includes(tab))metadata.push(['الصنف',!form.reportProduct||form.reportProduct==='all'?'كل الأصناف':s.products.find(p=>p.id===form.reportProduct)?.name||'صنف']);
 if(tab==='reps')metadata.push(['شهر التارجت والتحقيق',month]);
 if(tab==='cash'||tab==='purchases')metadata.push(['تنبيه','الأرصدة والمديونيات الحالية لا تتأثر باختيار الفترة']);
 if(tab==='movements'&&search)metadata.push(['بحث المستندات',search]);
 return {title:reportTitles[tab],heads,rows,numericColumns,moneyColumns,percentColumns,metadata};
}
function numberCell(value:any){const text=String(value??'').replaceAll(',','').replace(/[٪%]$/,'');return /^-?\d+(\.\d+)?$/.test(text)?Number(text):null}
export function reportWorkbook(XLSX:typeof import('xlsx'),report:ReportExport){
 const rows=report.rows.map(row=>row.map((value,column)=>{if(report.numericColumns.includes(column)||report.percentColumns.includes(column)){const n=numberCell(value);if(n!==null)return report.percentColumns.includes(column)?n/100:n}return String(value??'')}));
 const ws=XLSX.utils.aoa_to_sheet([report.heads,...rows]);ws['!cols']=report.heads.map((_,c)=>({wch:Math.min(55,[report.heads,...rows].reduce((max,row)=>Math.max(max,String(row[c]??'').length+2),16))}));
 for(let row=1;row<=rows.length;row++)for(const col of [...report.numericColumns,...report.percentColumns]){const cell=ws[XLSX.utils.encode_cell({r:row,c:col})];if(cell?.t==='n')cell.z=report.percentColumns.includes(col)?'0%':report.moneyColumns.includes(col)?'#,##0.00':'#,##0';}
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'التقرير');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(report.metadata),'بيانات التقرير');wb.Workbook={Views:[{RTL:true}]};wb.Props={Title:report.title,Company:report.metadata[0][1]};return wb;
}
const esc=(v:any)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function printableReport(report:ReportExport){return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(report.title)+'</title><style>@page{size:A4 '+(report.heads.length>4?'landscape':'portrait')+';margin:12mm}body{font:14px/1.7 Arial,Tahoma,sans-serif;color:#000;background:#fff}h1{font-size:22px}h2{font-size:18px}header{text-align:center;border-bottom:2px solid #333}table{border-collapse:collapse;width:100%;margin:16px 0;table-layout:fixed}td,th{border:1px solid #777;padding:6px;text-align:right;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}footer{margin-top:15px}</style></head><body><header><h1>'+esc(report.metadata[0][1])+'</h1><h2>'+esc(report.title)+'</h2></header>'+report.metadata.slice(2).map(([k,v])=>'<p><strong>'+esc(k)+': </strong>'+esc(v)+'</p>').join('')+'<table><thead><tr>'+report.heads.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(report.rows.length?report.rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+report.heads.length+'">لا توجد بيانات للفلاتر المختارة</td></tr>')+'</tbody></table><footer>جميع المبالغ بالجنيه المصري · الأرقام باللغة الإنجليزية</footer></body></html>'}

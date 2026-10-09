import {date,num} from './format.ts';
import {stocktakeComparison,stocktakeReviewSummary} from './stocktake-counts.ts';
const esc=(value:any)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const titles:any={load:'إذن تحميل',carReturn:'مرتجع سيارة',stocktake:'إذن جرد المخزن',purchaseReceipt:'إذن استلام مشتريات'};
const statuses:any={approved:'معتمد',pending:'بانتظار الاعتماد — لا يغيّر الأرصدة',rejected:'مرفوض — لا يغيّر الأرصدة'};
const countStatus:any={matched:'مطابق',shortage:'عجز',surplus:'زيادة'};
const units=(pieces:number,pack:number)=>num(pieces)+' قطعة ('+num(Math.floor(pieces/pack))+' كرتونة + '+num(pieces%pack)+' قطعة)';
/** Quantity-only printing for scoped warehouse documents, regardless of approval status. */
export function printableWarehouseDocument(d:any,settings:any,products:any[],stocks:any,repName=''){
 if(!titles[d.type])throw new Error('نوع إذن غير مسموح للطباعة');
 const title=(d.type==='stocktake'&&d.repId?'إذن جرد السيارة':titles[d.type])+' #'+d.number;
 let body='<p>الحالة: <strong>'+esc(statuses[d.status]||d.status)+'</strong></p><p>التاريخ: '+esc(date(d.at))+' · مسؤول التسجيل: '+esc(d.actorName)+'</p>';
 if(repName)body+='<p>المندوب: '+esc(repName)+'</p>';
 if(d.supplierName)body+='<p>المورد: '+esc(d.supplierName)+'</p>';
 if(d.externalInvoice)body+='<p>رقم فاتورة المورد: '+esc(d.externalInvoice)+'</p>';
 if(d.type==='stocktake'){
  const rows=stocktakeComparison(d,products,stocks),summary=stocktakeReviewSummary(rows);
  body+='<p>مطابق: '+summary.matched+' · عجز: '+summary.shortage+' · زيادة: '+summary.surplus+'</p>';
  if(summary.stale)body+='<p class="warning">تغير الرصيد أو التعبئة بعد تسجيل الجرد؛ يلزم إعادة المراجعة قبل الاعتماد.</p>';
  body+='<table><thead><tr><th>الصنف</th><th>تعبئة الكرتونة</th><th>الدفتري وقت الجرد</th><th>الجرد الفعلي</th><th>الفرق</th></tr></thead><tbody>'+rows.map((r:any)=>'<tr class="'+r.status+'"><td>'+esc(r.name)+'</td><td>'+esc(num(r.pack))+' قطعة</td><td>'+esc(units(r.expected,r.pack))+'</td><td>'+esc(units(r.actual,r.pack))+'</td><td>'+esc(r.difference===0?'مطابق':countStatus[r.status]+' '+units(Math.abs(r.difference),r.pack))+'</td></tr>').join('')+'</tbody></table><p>المقارنة تخص الأصناف المسجلة في الإذن فقط.</p>';
 }else body+='<table><thead><tr><th>الصنف</th><th>الكود</th><th>الكمية</th><th>الوحدة</th><th>إجمالي القطع</th></tr></thead><tbody>'+(d.lines||[]).map((l:any)=>'<tr>'+[l.name,l.code,num(l.quantity),l.unit==='carton'?'كرتونة':'قطعة',num(l.pieces)].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 if(d.reviewedBy)body+='<p>المراجع: '+esc(d.reviewedBy)+' · '+esc(d.reviewReason)+'</p>';
 return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{size:auto;margin:12mm}body{font-family:Arial,Tahoma,sans-serif;color:#111;background:white;font-size:14px;line-height:1.6}header{text-align:center;border-bottom:2px solid #333;margin-bottom:16px}h1{font-size:22px}h2{font-size:18px}table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #777;padding:8px;text-align:right;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}.matched{color:#17532d;background:#eef9f1}.shortage{color:#872828;background:#fff0f0}.surplus{color:#704e00;background:#fff8de}.warning{color:#872828;border:1px solid;padding:10px}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body><header><h1>'+esc(settings.name)+'</h1><p>مخزن '+esc(settings.productCategories?.[0]?.name||'القسم')+'</p><h2>'+esc(title)+'</h2></header>'+body+'</body></html>';
}

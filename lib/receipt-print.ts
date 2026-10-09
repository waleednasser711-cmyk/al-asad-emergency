// Only markup from the rendered receipt is passed here (React has escaped its data).
export function receiptPrintHtml(markup:string,paper:unknown){
 const width=[58,80,104].includes(Number(paper))?Number(paper):104;
 return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة شركة الأسد</title><style>
 @page{size:${width}mm 200mm;margin:0}
 *{box-sizing:border-box}html,body{margin:0;padding:0;width:${width}mm;max-width:100%;background:#fff;color:#000}
 body{font-family:Arial,Tahoma,sans-serif;font-size:12px;line-height:1.5}
 .receipt-paper{position:static;width:100%;max-width:100%!important;margin:0;padding:3mm 2mm;overflow-wrap:anywhere}
 h2{font-size:18px}h3{font-size:15px}h2,h3,.receipt-end{text-align:center;margin:6px 0}
 p{margin:5px 0}hr{border:0;border-top:1px dashed #000;margin:8px 0}
 table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:11px}
 th,td{text-align:right;padding:5px 2px;vertical-align:top;border-bottom:1px dotted #777;overflow-wrap:anywhere}
 th:first-child{width:40%}th:nth-child(2){width:20%}th:nth-child(3),th:nth-child(4){width:20%}
 thead{display:table-header-group}tr{break-inside:avoid}
 .receipt-total{display:flex;justify-content:space-between;gap:8px;font-size:14px;font-weight:bold;flex-wrap:wrap}
 </style></head><body data-receipt-width="${width}">${markup}</body></html>`;
}
export function printThermalReceipt(markup:string,paper:unknown,onError:(message:string)=>void){
 const frame=document.createElement('iframe');
 frame.title='طباعة فاتورة المندوب';
 frame.style.cssText='position:fixed;width:104mm;height:1px;left:-10000px;bottom:0;border:0';
 frame.onload=async()=>{try{
  const w=frame.contentWindow;if(!w)throw new Error('print unavailable');
  const width=Number(w.document.body.dataset.receiptWidth);frame.style.width=width+'mm';
  await w.document.fonts.ready;
  await new Promise<void>(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(()=>resolve())));
  const height=Math.max(30,Math.ceil(w.document.body.getBoundingClientRect().height*25.4/96)+2);
  const style=w.document.createElement('style');style.textContent='@page{size:'+width+'mm '+height+'mm;margin:0}';w.document.head.appendChild(style);
  w.addEventListener('afterprint',()=>frame.remove(),{once:true});w.focus();w.print();
  setTimeout(()=>frame.remove(),60000);
 }catch{frame.remove();onError('تعذر تجهيز الفاتورة للطباعة؛ حاول مرة أخرى');}};
 frame.srcdoc=receiptPrintHtml(markup,paper);document.body.appendChild(frame);
}

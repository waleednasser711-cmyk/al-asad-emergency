import {zlibSync} from 'fflate';
import {fmt,num,date} from './format.ts';
import {documentLabels} from './print-documents.ts';
import {isPosted} from './document-status.ts';
export const receiptDots=(paper:unknown)=>([58,80,104].includes(Number(paper))?Number(paper):104)*8;
export function crc16(text:string){let crc=0;for(let i=0;i<text.length;i++){crc^=text.charCodeAt(i)<<8;for(let b=0;b<8;b++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;}return crc.toString(16).toUpperCase().padStart(4,'0');}
const base64=(bytes:Uint8Array)=>{let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);};
export function bitmapZpl(width:number,height:number,pixels:Uint8ClampedArray){
 if(!Number.isInteger(width)||width<1||width>832||!Number.isInteger(height)||height<1||height>7900||pixels.length!==width*height*4)throw new Error('حجم الفاتورة غير مناسب للطباعة المباشرة؛ استخدم طباعة / حفظ PDF');
 const row=Math.ceil(width/8),packed=new Uint8Array(row*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;const shade=(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2])*pixels[i+3]/255+255-pixels[i+3];if(shade<180)packed[y*row+(x>>3)]|=0x80>>(x&7);}
 const data=base64(zlibSync(packed,{level:6}));
 // One temporary graphic, one copy. No stored files, calibration, reset or persistent settings.
 return `^XA^PW${width}^LL${height}^LH0,0^LT0^LS0^PON^FO0,0^GFA,${packed.length},${packed.length},${row},:Z64:${data}:${crc16(data)}^FS^PQ1^XZ`;
}
export function rawBtIntent(zpl:string){const payload=base64(new TextEncoder().encode(zpl));if(payload.length>250000)throw new Error('الفاتورة كبيرة للطباعة المباشرة؛ استخدم طباعة / حفظ PDF');return 'intent:base64,'+payload+'#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;';}
export function directReceiptCanvas(d:any,settings:any){
 const width=receiptDots(settings.paper),canvas=document.createElement('canvas');canvas.width=width;canvas.height=1;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('تعذر تجهيز صورة الفاتورة');
 const inset=16,content=width-inset*2,ops:Array<()=>void>=[];let y=40;
 const text=(value:any,size=24,bold=false,center=false)=>{const t=String(value??'');ctx.font=`${bold?'bold ':''}${size}px Arial`;const lines:string[]=[];let current='';for(const char of t){if(char==='\n'||(current&&ctx.measureText(current+char).width>content)){lines.push(current);current=char==='\n'?'':char;}else current+=char;}if(current)lines.push(current);for(const line of lines){const top=y;ops.push(()=>{ctx.font=`${bold?'bold ':''}${size}px Arial`;ctx.textAlign=center?'center':'right';ctx.fillText(line,center?width/2:width-inset,top);});y+=size*1.45;}};
 const divider=()=>{y+=8;const top=y;ops.push(()=>{ctx.fillRect(inset,top,content,1);});y+=26;};
 text(settings.name,30,true,true);if(settings.address)text(settings.address,21,false,true);if(settings.phone)text(settings.phone,22,false,true);if(settings.commercialRegister)text('السجل التجاري: '+settings.commercialRegister,21,false,true);if(settings.taxCard)text('البطاقة الضريبية: '+settings.taxCard,21,false,true);divider();
 text((documentLabels[d.type]||d.type)+' #'+d.number,27,true);text(date(d.at),22);text('العميل: '+(d.customerName||''));if(d.customerPhone)text('هاتف العميل: '+d.customerPhone,22);if(d.customerAddress)text('عنوان العميل: '+d.customerAddress,22);text('اسم المندوب: '+(d.actorName||''),22);
 if(d.cancelledAt){text('فاتورة ملغاة',25,true);text('سبب الإلغاء: '+d.cancellationReason,22);}
 if(d.type==='saleReturn'){text('الحالة: '+({approved:'معتمد',pending:'بانتظار الاعتماد',rejected:'مرفوض'} as any)[d.status],22);if(!isPosted(d))text('لا يؤثر على الأرصدة',22);if(d.postedAt)text('الاعتماد: '+date(d.postedAt)+' · '+(d.reviewedBy||''),21);if(d.reviewReason)text('سبب المراجعة: '+d.reviewReason,21);}divider();
 const tableRow=(values:string[],bold=false)=>{const ratios=[.4,.2,.2,.2];let right=width-inset;const columns=values.map((value,i)=>{const span=content*ratios[i],x=right-4;right-=span;ctx.font=`${bold?'bold ':''}22px Arial`;const lines:string[]=[];let current='';for(const char of value){if(current&&ctx.measureText(current+char).width>span-8){lines.push(current);current=char;}else current+=char;}lines.push(current);return{x,lines};});const top=y;ops.push(()=>{ctx.font=`${bold?'bold ':''}22px Arial`;ctx.textAlign='right';for(const col of columns)col.lines.forEach((line,i)=>ctx.fillText(line,col.x,top+i*32));});y+=Math.max(...columns.map(c=>c.lines.length))*32+8;const border=y;ops.push(()=>ctx.fillRect(inset,border,content,1));y+=28;};
 tableRow(['الصنف','الكمية','السعر','الإجمالي'],true);
 for(const l of d.lines||[])tableRow([String(l.name),num(l.quantity)+' '+(l.unit==='carton'?'كرتونة':'قطعة'),fmt(l.price),fmt(l.total)]);
 divider();
 text('الإجمالي: '+fmt(d.total)+' ج.م',28,true);
 if(d.type==='sale'){text('المدفوع: '+fmt(d.paid)+' ج.م');text('المتبقي من الفاتورة: '+fmt(d.total-d.paid)+' ج.م');text('المديونية بعد الفاتورة: '+fmt(d.afterDebt)+' ج.م');}else text((isPosted(d)?'النقدية المستردة: ':'النقدية المطلوب ردّها: ')+fmt(d.refund)+' ج.م');
 if(d.note)text(d.note,22);divider();text('شكرًا لتعاملكم مع شركة الأسد',23,false,true);
 const height=Math.ceil(y+16);if(height>7900)throw new Error('الفاتورة طويلة للطباعة المباشرة؛ استخدم طباعة / حفظ PDF');
 canvas.height=height;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#000';ctx.direction='rtl';for(const op of ops)op();return canvas;
}
export async function prepareDirectReceipt(d:any,settings:any){await document.fonts.ready;const canvas=directReceiptCanvas(d,settings),ctx=canvas.getContext('2d')!;return rawBtIntent(bitmapZpl(canvas.width,canvas.height,ctx.getImageData(0,0,canvas.width,canvas.height).data));}

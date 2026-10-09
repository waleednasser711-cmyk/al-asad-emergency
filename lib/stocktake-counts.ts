const MAX_QUANTITY=100000000;
function quantity(value:any,label:string){
 if((typeof value!=='number'&&typeof value!=='string')||value==='')throw new Error(label+' يجب أن يكون عددًا صحيحًا');
 const n=Number(value);if(!Number.isSafeInteger(n)||n<0||n>MAX_QUANTITY)throw new Error(label+' يجب أن يكون عددًا صحيحًا غير سالب');return n;
}
/** Stock remains in pieces. Preserve the entered breakdown and pack at count time. */
export function stocktakeQuantity(input:any,pack:number){
 const size=quantity(pack,'تعبئة الكرتونة');if(size<1)throw new Error('تعبئة الكرتونة غير صالحة');
 if(input.pack!==undefined&&input.pack!==size)throw new Error('تغيرت تعبئة الصنف؛ حدّث الجرد');
 if(input.cartons===undefined&&input.loosePieces===undefined)return {actual:quantity(input.actual,'الجرد الفعلي'),pack:size};
 const cartons=quantity(input.cartons??0,'عدد الكراتين'),loosePieces=quantity(input.loosePieces??0,'عدد القطع');
 const actual=cartons*size+loosePieces;if(!Number.isSafeInteger(actual)||actual>MAX_QUANTITY)throw new Error('إجمالي الجرد أكبر من الحد المسموح');
 if(input.actual!==undefined&&quantity(input.actual,'الجرد الفعلي')!==actual)throw new Error('إجمالي الجرد لا يطابق الكراتين والقطع');
 return {actual,pack:size,cartons,loosePieces};
}
export function stocktakeComparison(document:any,products:any[],stocks:any){
 const location=document.location||'warehouse';return (document.counts||[]).map((count:any)=>{
  const product=products.find(p=>p.id===count.productId),pack=count.pack||product?.pack||1;
  const difference=count.actual-count.expected,current=stocks[location]?.[count.productId]||0;
  return {...count,pack,difference,current,status:difference<0?'shortage':difference>0?'surplus':'matched',stale:document.status==='pending'&&(!product||current!==count.expected||count.pack!==undefined&&count.pack!==product.pack)};
 });
}
export function stocktakeReviewSummary(rows:any[]){return {matched:rows.filter(r=>r.difference===0).length,shortage:rows.filter(r=>r.difference<0).length,surplus:rows.filter(r=>r.difference>0).length,stale:rows.some(r=>r.stale)};}

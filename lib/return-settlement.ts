/** All values are piastres; credit returns reduce existing debt before refunding cash. */
export function automaticReturnSettlement(invoice:any,total:number,debt:number){
 const cashSale=invoice.payment==='cash'||invoice.payment===undefined&&invoice.paid>=invoice.total;
 const debtReduction=cashSale?0:Math.min(total,Math.max(0,debt));
 return {total,debtReduction,refund:total-debtReduction};
}

/** Match the server's cumulative rounding against the original invoice, not today's price. */
export function returnBasketTotal(invoice:any,cart:any[],products:any[]){
 return cart.reduce((total:number,line:any)=>{
  const original=invoice.lines?.find((l:any)=>l.productId===line.productId);
  const product=products.find((p:any)=>p.id===line.productId);
  const quantity=Number(line.quantity),pieces=quantity*(line.unit==='carton'?product?.pack||0:1);
  const previous=invoice.returned?.[line.productId]||0;
  if(!original||!Number.isSafeInteger(pieces)||pieces<=0||previous+pieces>original.pieces)return total;
  return total+Math.round(original.total*(previous+pieces)/original.pieces)-Math.round(original.total*previous/original.pieces);
 },0);
}

export function remainingSaleReturnLines(invoice:any){
 return (invoice.lines||[]).map((line:any)=>({productId:line.productId,unit:'piece',quantity:line.pieces-(invoice.returned?.[line.productId]||0)})).filter((line:any)=>line.quantity>0);
}

import {isPosted} from './document-status.ts';
type ProductSale={productId:string,code:string,name:string,pack:number,soldPieces:number,returnedPieces:number,sales:number,returns:number};
export type RepProductSales={repId:string,days:Record<string,Record<string,ProductSale>>};
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'});
/** Read-only quantities and revenue: never include customer, invoice or cost data. */
export function addProductSales(summary:RepProductSales,documents:any[],products:any[]){
 const catalog=new Map(products.map(p=>[p.id,p]));
 for(const d of documents){
  if(d.location!==summary.repId||!isPosted(d)||!['sale','saleReturn'].includes(d.type))continue;
  const day=date.format(new Date(d.postedAt||d.at)),rows=summary.days[day]??=Object.create(null);
  for(const l of d.lines||[]){
   const p=catalog.get(l.productId),pack=p?.pack||(l.unit==='carton'?l.pieces/l.quantity:1);
   const row=rows[l.productId]??={productId:l.productId,code:p?.code||l.code||'',name:p?.name||l.name||'',pack,soldPieces:0,returnedPieces:0,sales:0,returns:0};
   if(d.type==='sale'){row.soldPieces+=l.pieces;row.sales+=l.total;}
   else{row.returnedPieces+=l.pieces;row.returns+=l.total;}
  }
 }
 return summary;
}
export function buildRepProductSales(documents:any[],products:any[],repId:string):RepProductSales{
 return addProductSales({repId,days:Object.create(null)},documents,products);
}
export function accountProductSales(state:{documents:any[],products:any[],repProductSales?:RepProductSales},repId:string,from?:string,to?:string){
 const summary=state.repProductSales?.repId===repId?state.repProductSales:buildRepProductSales(state.documents,state.products,repId);
 const rows:Record<string,ProductSale>=Object.create(null);
 for(const [day,values] of Object.entries(summary.days)){
  if(from&&day<from||to&&day>to)continue;
  for(const value of Object.values(values)){
   const row=rows[value.productId]??={...value,soldPieces:0,returnedPieces:0,sales:0,returns:0};
   row.soldPieces+=value.soldPieces;row.returnedPieces+=value.returnedPieces;row.sales+=value.sales;row.returns+=value.returns;
  }
 }
 return Object.values(rows).map(row=>({...row,netPieces:row.soldPieces-row.returnedPieces,netSales:row.sales-row.returns})).sort((a,b)=>a.code.localeCompare(b.code,'ar',{numeric:true}));
}

import {isPosted} from './document-status.ts';
/** Amounts are in piastres. Callers select the period/location before aggregation. */
export function salesSummary(documents:any[]){
 let sales=0,returns=0,invoices=0,returnInvoices=0;
 for(const d of documents){
  if(!isPosted(d))continue;
  if(d.type==='sale'){sales+=d.total;invoices++;}
  else if(d.type==='saleReturn'){returns+=d.total;returnInvoices++;}
 }
 return {sales,returns,netSales:sales-returns,invoices,returnInvoices};
}
export function approvedReturnsByInvoice(documents:any[]){
 const totals:Record<string,number>=Object.create(null);
 for(const d of documents)if(d.type==='saleReturn'&&isPosted(d)&&d.originalId)totals[d.originalId]=(totals[d.originalId]||0)+d.total;
 return totals;
}

const cairoDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'});
const salesDay=(d:any)=>cairoDate.format(new Date(d.postedAt||d.at));
export type SalesAccounting={repId:string,days:Record<string,ReturnType<typeof salesSummary>>};
/** Aggregate own posted sales without disclosing revoked customers or their invoices. */
export function buildSalesAccounting(documents:any[],repId:string):SalesAccounting{
 const days:SalesAccounting['days']=Object.create(null);
 for(const d of documents){
  if(d.location!==repId||!isPosted(d)||!['sale','saleReturn'].includes(d.type))continue;
  const day=salesDay(d),total=days[day]??={sales:0,returns:0,netSales:0,invoices:0,returnInvoices:0};
  if(d.type==='sale'){total.sales+=d.total;total.invoices++;}else{total.returns+=d.total;total.returnInvoices++;}
  total.netSales=total.sales-total.returns;
 }
 return {repId,days};
}
export function accountSalesSummary(state:{documents:any[],salesAccounting?:SalesAccounting},location?:string,from?:string,to?:string){
 if(location&&state.salesAccounting?.repId===location){
  const total={sales:0,returns:0,netSales:0,invoices:0,returnInvoices:0};
  for(const [day,value] of Object.entries(state.salesAccounting.days)){
   if(from&&day<from||to&&day>to)continue;
   for(const key of ['sales','returns','invoices','returnInvoices'] as const)total[key]+=value[key];
  }
  total.netSales=total.sales-total.returns;return total;
 }
 return salesSummary(state.documents.filter(d=>(!location||d.location===location)&&(!from||salesDay(d)>=from)&&(!to||salesDay(d)<=to)));
}

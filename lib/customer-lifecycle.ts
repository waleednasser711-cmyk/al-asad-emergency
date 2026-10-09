type Customer={id:string;debt:number;archived?:boolean};
/** Any reference, including a pending/rejected request, protects the history. */
export function customerCanDelete(customer:Customer,documents:any[]):boolean {
 return customer.debt===0&&!documents.some(d=>d.customerId===customer.id||d.customer?.id===customer.id);
}
export function saleCustomers(customers:Customer[]):Customer[]{return customers.filter(c=>!c.archived)}

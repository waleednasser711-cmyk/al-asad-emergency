// Display-only enrichment from the current account's already authorized customers.
export function receiptWithCustomer(receipt:any,customers:any[]){
 const customer=customers.find(c=>c.id===receipt.customerId);
 return {...receipt,customerPhone:receipt.customerPhone??customer?.phone??'',customerAddress:receipt.customerAddress??customer?.address??''};
}

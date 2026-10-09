// Keep Arabic labels and use Latin digits throughout screens, reports and printed receipts.
export const fmt=(n=0)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n/100);
export const num=(n=0)=>new Intl.NumberFormat('en-US').format(n);
export const date=(s:string)=>new Date(s).toLocaleString('ar-EG-u-nu-latn',{timeZone:'Africa/Cairo',dateStyle:'short',timeStyle:'short'});

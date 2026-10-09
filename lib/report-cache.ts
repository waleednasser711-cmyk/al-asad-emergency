import {createReports} from './reports.ts';
// Each cache belongs to one immutable state/filter/month snapshot. React recreates
// it when any input changes; calculations remain the existing report functions.
export function createCachedReports(...args:Parameters<typeof createReports>){
 const reports=createReports(...args);
 function once<T>(calculate:()=>T){let ready=false;let result:T;return ()=>{if(!ready){result=calculate();ready=true}return result}}
 return {...reports,profit:once(reports.profit),profitRows:once(reports.profitRows),repReport:once(reports.repReport),productReport:once(reports.productReport),purchaseReport:once(reports.purchaseReport),cashReport:once(reports.cashReport),inventoryReport:once(reports.inventoryReport),balanceRows:once(reports.balanceRows),auditRows:once(reports.auditRows)};
}

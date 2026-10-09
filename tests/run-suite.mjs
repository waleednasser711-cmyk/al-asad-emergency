import {spawnSync} from 'node:child_process';
const categoriesTest=spawnSync(process.execPath,['tests/product-categories.test.mjs'],{stdio:'inherit'});if(categoriesTest.status!==0)process.exit(categoriesTest.status||1);
const importAssignmentsTest=spawnSync(process.execPath,['tests/assignment-import.test.mjs'],{stdio:'inherit'});if(importAssignmentsTest.status!==0)process.exit(importAssignmentsTest.status||1);
const assignmentsTest=spawnSync(process.execPath,['tests/rep-assignments.test.mjs'],{stdio:'inherit'});if(assignmentsTest.status!==0)process.exit(assignmentsTest.status||1);
const pickerTest=spawnSync(process.execPath,['tests/sale-picker-products.test.mjs'],{stdio:'inherit'});if(pickerTest.status!==0)process.exit(pickerTest.status||1);
for(const file of ['rep-product-sales.test.mjs','offline-sales.test.mjs','offline-store.test.mjs','offline-sw.test.mjs','usernames.test.mjs','warehouse-car-stocktake.test.mjs','warehouse-print.test.mjs','stocktake-counts.test.mjs','warehouse-access.test.mjs','reopen-sale-return.test.mjs','cancel-sale.test.mjs','return-settlement.test.mjs','sales-return-reconciliation.test.mjs','rep-category-visibility.test.mjs','performance-cache.test.mjs','report-export.test.mjs','customer-lifecycle.test.mjs','business.test.mjs','workflows.test.mjs','costing.test.mjs','reports.test.mjs','import-backup.test.mjs','enhancements.test.mjs','return-approval.test.mjs','backup-format.test.mjs','product-prices.test.mjs','customer-statement-print.test.mjs','bulk-customer-approval.test.mjs','recovery-token.test.mjs']){
 const result=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS: all unit, report, workbook and backup suites');

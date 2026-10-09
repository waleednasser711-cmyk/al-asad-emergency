# Customer deletion and archiving

Only the main admin account can delete, archive or reactivate a customer. The customers table has per-customer controls and a switch to include archived customers.

Deletion requires an exactly zero balance and no document referencing the customer, including pending/rejected requests. The server rechecks this against the current revision. Existing optimistic transaction guards and request replay protection remain in place. Historical customers must be archived instead.

Archiving changes only the optional archived flag. New sales are blocked both in the picker and server. Statements, collections, debt adjustments, existing returns and all reports remain available. Reactivation is admin-only. Existing customers without the flag are active; ordinary editing and Excel imports preserve the flag. Legacy and staged backups retain the optional flag, while old copies still validate.

Every lifecycle operation adds a user/time audit with customer ID, name and code. No operation modifies stored invoices, cash, stock, suppliers or other customers. No schema migration or automatic data rewrite is required.

Validation: customer-lifecycle.test.mjs checks domain protections and backup compatibility; api.test.mjs checks permissions, request replay, guarded concurrent delete/debt, archive restore and reactivation. run-suite.mjs covers existing accounting, reports, Excel, return approvals, statements and backup algorithms; run-api.mjs uses an isolated local database and includes backup/restore, account recovery and business API regression checks. These tests do not use the production company's business data or claim physical printer/device QA.

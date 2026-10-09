# Offline sales and rollback

Original deployed source: e97e09479a351681bf64e8d6c79978c9ed1276ce (Sites version 46).
Pre-release complete database/image backup: manual-ef8fae50-fe5f-4b40-8ea0-f45f1e0adc12, revision 207, completed 2026-10-08T23:56:30.304Z.

Only rep sales use the local queue. Other mutations require connectivity and an empty queue. Existing admin/warehouse online accounting and all receipt renderers remain unchanged.

Open and log in on the rep device while online once to cache the application shell and assigned snapshot. IndexedDB stores the per-account snapshot and immutable sales. Successful local save means transaction completion, not merely a successful write request. Device storage persistence is requested, but browser data deletion/device loss can still remove unsynced data. Export pending sales from Settings or by clicking the pending count in the existing connection indicator. Import on the same account is idempotent. Logging out retains pending sales but clears the active cached identity.

Auto-sync runs with the application open and a valid session. Each UUID has an immutable payload fingerprint. The server retries optimistic transactions and applies stock/cash/debt/report movements once. Client rows are removed only in the same IndexedDB transaction that saves a confirming full server snapshot. Lost responses, failed local acknowledgments and recovered backup imports reuse the same UUID. Do not upload replacement balances.

An unresolved conflict remains in the local queue and creates a non-financial pending offlineSale request. The queue stops there. Only the main account can post it after fixing stock/assignment/price/pack issues; a written reason is required, including any explicit credit-policy override. Active roles, assignments, stock and original prices are checked again. Costs are calculated on the server. Invoice dates retain the recorded creation time; synchronized time is stored separately. Rep totals remain provisional until posting.

## Rollback procedure

1. Stop issuing new offline sales. Reconnect rep devices, synchronize all queues and resolve pending review requests. If a device cannot synchronize, export its complete pending-sales JSON and keep it safe before proceeding.
2. Preserve the CURRENT database and images. Code rollback does not mean restoring the pre-release database: that would discard subsequent financial transactions.
3. On rep browsers, unregister only the service worker whose script pathname is /offline-sw.js, and remove only cache asad-shell-offline-v1. Never delete IndexedDB asad-offline-v1. This prevents a cached newer shell from running against the older server after rollback.
4. Deploy the original saved source/version above; reload affected devices online. Unsynced sales retained locally must be imported into a compatible version and reconciled once. The old interface cannot review offlineSale requests, so finish those reviews before reverting, or keep them for a later compatible release.
5. Never manually repost an exported sale with a new UUID or restore old balances to resolve a queue: both can duplicate/erase valid financial movements.

Verification: core regressions (cash, credit, returns, cancellation, stock, reports, assignments, warehouse permissions, backup/restore), isolated D1 concurrency/lost-response/review tests, transaction failure/recovery harness, service-worker API-cache exclusion tests and TypeScript/build checks. The transaction harness exercises asynchronous commit/abort semantics; it is not a physical Android device test.

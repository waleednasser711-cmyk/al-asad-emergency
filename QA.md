# نتائج اختبار برنامج شركة الأسد

تاريخ الاختبار: 2026-10-06، بتوقيت القاهرة.

النتيجة: نجحت الاختبارات الآلية الموضحة أدناه بعد الإصلاحات. هذه النتائج لا تعني ضمان خلو البرنامج من كل عيب، ولا تشمل اختبار المتصفح والأجهزة الفعلية أو أحمال الاستضافة الإنتاجية.

## ما تم اختباره

- 100 سيناريو بيع بالكرتونة، دفع جزئي، مرتجع على دفعات بالقطعة حتى استرداد الفاتورة بالكامل، وتفريغ السيارة باعتماد المدير. تمت مراجعة 1100 نتيجة للأرصدة والتقريب والصلاحيات.
- نقدي وآجل، التحصيل، السداد، المصروفات، الرصيد الافتتاحي، تحميل السيارة ومرتجعها والتوريد والاعتماد والرفض. رفض مخزون ونقدية ومديونية سالبة، كميات كسرية، سلة مكررة وسعر مخالف لتصنيف المندوب.
- أسعار الجملة والتجزئة للقطعة والكرتونة، إخفاء الأسعار الأخرى والتكلفة عن المندوب، ثبات أسعار وتكلفة الفواتير القديمة، تغيير التصنيف وإبطال الجلسات.
- مبيعات وأرباح ومبيعات المناديب والأصناف ومشتريات الموردين والنقدية والمخزون والأرصدة وسجل التعديلات، مع فلاتر المندوب والصنف والتاريخ وحدود منتصف الليل بتوقيت القاهرة. تمت مقارنة قيم العرض بقيم محسوبة مسبقًا، لا بمجرد إعادة نفس المعادلة في الاختبار.
- مثال التقرير المستقل: مبيعات 160.00، مرتجعات 18.00، صافي مبيعات 142.00، تكلفة مبيعات بعد المرتجعات 79.00، مجمل ربح 63.00، مصروفات 10.00، صافي نتيجة 53.00 ج.م. النقدية الرئيسية 1020.00، مديونية العميل 62.00، مديونية المورد 46.00، تقييم المخزون 757.00 ج.م.
- متوسط تكلفة الشراء، إعادة مرتجع بيع بتكلفته الأصلية إلى متوسط المخزون الحالي، وسحب مرتجع الشراء بمتوسط التكلفة وتسجيل الفرق عن قيمة المورد في تسويات نتيجة التشغيل. يوجد تقريب إلى قرش واحد لتكلفة القطعة.
- ملفات XLSX حقيقية للأصناف والعملاء، الأسماء العربية، الهاتف كنص مع صفره الأول، تحديث الأكواد مع حفظ هوية الحساب ومديونيته، أسعار الجملة القديمة الاختيارية، صفوف غير سليمة وأكواد مكررة، وحد 3000 صف. معالجة ملف 3000 صنف محليًا نحو 0.3 ثانية؛ الرقم قياس تجريبي وليس وعد أداء على الأجهزة أو الاستضافة.
- ZIP للبيانات والصور: فك وضغط وتحقيق تطابق، ورفض النسخ ذات معرّفات أو أرقام مستندات مكررة ومراجع وتواريخ وقيم غير سليمة. استرجاع فعلي على D1 تجريبي، واسترجاع صورة R2 بمعرّف جديد مع حفظ bytes والصلاحيات وحسابات الدخول الحالية.
- API على النسخة المبنية مع قاعدة D1 وحاوية R2 محليتين منفصلتين: إنشاء الحساب، الدخول، الجلسات، التارجت، كلمات السر، تحديثات المزامنة، منع CSRF، صلاحيات المدير والمندوب، رفض العمليات دون أي تغيير جزئي في البيانات.
- 10 طلبات كتابة متزامنة على نفس الإصدار: حفظ واحد ورفض 9 تعارضات. بعد إعادة المحاولة حُفظت 10 فواتير بالضبط، ثم إعادة إرسال الطلبات نفسها لم تضاعف أي فاتورة أو رصيد. 20 قراءة متزامنة للمزامنة نجحت. زمن p95 محلي في الجولة الأولى نحو 122 ms. هذا اختبار تنازع محدود وليس اختبار حمل إنتاجي.
- فتح الصفحة الأولى قبل وجود مستخدم وإرجاع HTTP 200، فحص TypeScript، وبناء Worker.

## الإصلاحات الناتجة عن المراجعة

1. إصلاح وصول المندوب إلى صورة توريد رفعها المدير وربطها بإذن المندوب، مع استمرار منع المناديب الآخرين.
2. زيادة مساحة الرسم المؤقت لصورة الفاتورة لمنع قص آخر سطورها في الحالات التي تحتوي هاتف الشركة وتصنيف السعر.
3. توحيد تحقق Excel بين الشاشة والخادم، ومنع الأكواد المكررة والاسم أو الكود المكون من مسافات، ومنع حفظ جزء من استيراد غير سليم.
4. تشديد تحقق الاسترجاع ضد معرّفات المستندات المكررة ومراجع وقيم غير سليمة.
5. منع الحسابات التي تتجاوز دقة الأعداد الصحيحة وحدود كميات المخزون.
6. السماح للمندوب بمرتجع فاتورة سجلها المدير من سيارة ذلك المندوب، مع منع مرتجعات سيارات الآخرين.
7. ضبط تكلفة مرتجعات البيع والمشتريات عند تغير متوسط التكلفة، وإظهار تسوية تكلفة مرتجع الشراء في تقرير النتيجة التشغيلية للعمليات الجديدة. الفواتير القديمة لا يعاد حسابها أو تعديلها.
8. فصل نفس دوال التقرير المستخدمة في الشاشات إلى ملف قابل للاختبار؛ لا توجد معادلات بديلة للاختبارات فقط.

## ما لم يُختبر بعد

- التنقل والنماذج بصريًا داخل متصفح على الكمبيوتر والموبايل. بيئة التحكم المطلوبة لمتصفح المعاينة غير متاحة في هذه الجلسة؛ نجاح فحص الكود وبناء الصفحة لا يعادل هذا الاختبار.
- الطباعة على Zebra ZQ520 أو غيرها، البلوتوث وخدمة الطباعة في Android ومقاس الورق والهوامش الفعلية. تجهيز الطباعة ومشاركة الصورة موجودان؛ اختبار العتاد مطلوب.
- انقطاع الشبكة فعليًا داخل المتصفح، اختلاف المتصفحات، مشاركة الصورة على التطبيقات، وأجهزة منخفضة الذاكرة.
- حمل إنتاجي طويل مع عدد كبير من المناديب وحجم تاريخ كبير. التحديث كل ثانية يحدث أثناء فتح الصفحة ومع توفر الإنترنت؛ تعارض الحفظ يطلب مراجعة الأرصدة وإعادة المحاولة.
- نسخ احتياطية ضخمة قرب حد 50 MB أو بيانات تتجاوز حدود الاسترجاع وعدد السجلات.
- الربط الخارجي للمناديب: صلاحية رابط الاستضافة ما زالت خاصة بصاحب البرنامج قبل دخول اسم المستخدم وكلمة السر. نشر الإصلاحات لم يغيّر المشاركة.

## إعادة تشغيل الاختبارات

من داخل المصدر:

```sh
node tests/run-suite.mjs
node node_modules/typescript/bin/tsc --noEmit
node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.75/scripts/build-site.mjs
node tests/run-api.mjs
```

آخر أمر يبني قاعدة تجريبية داخل `.wrangler/api-test` ويستخدمها فقط، ولا يمس قاعدة الإنتاج أو بيانات العمل المحلية المعتادة. مسار سكربت البناء خاص ببيئة Sites؛ في بيئة أخرى يستخدم أمر build بالمشروع مع إعداد Cloudflare المناسب.

## إضافات اختيارية — 2026-10-06

أُضيف حد ائتماني ومدة سداد ومنع الآجل للمتأخرين، وأعمار المديونيات، وجرد مع اعتماد وفحص تغير الأرصدة، وكشف عهدة وإقفال يوم لا يغير النقدية أو يمنع البيع، وباركود قطعة وكرتونة، وعمولات شهرية مع صرف مؤكد من الخزنة، ونسخ ZIP سحابية يومية مستقلة عن بيانات التشغيل.

نجحت اختبارات الوظائف القديمة كاملة بعد الإضافة. اختبارات إضافية قارنت المستندات والأرصدة قبل وبعد إعداد الائتمان والعمولات؛ الإعداد وحده لم يغير أي فاتورة أو رصيد. لا توجد حدود أو نسب مفروضة افتراضيًا. الديون القديمة غير المؤرخة تظهر «بدون موعد». فواتير البيع القديمة لا تُعاد كتابتها.

نجحت اختبارات حدود الائتمان والموافقة المسببة من المدير، والموعد الصحيح، والفئات 1/30/31/60/61 يومًا، والتحصيل بالأقدم وربط المرتجع بفاتورته، والباركود والفرادة، ومنع اعتماد جرد تغير رصيده، وإخفاء تكلفة الجرد عن المندوب، وحفظ واعتماد الإقفال دون تغيير المخزون أو النقدية، وعمولات صافي البيع والمبالغ المصروفة واحتساب الصرف ضمن المصروفات. استرجاع النسخ القديمة والجديدة محفوظ التوافق.

نجح اختبار النسخ على D1/R2: تشغيل دون متصفح، تكرار التشغيل لنفس اليوم دون تكرار النسخة، ZIP صحيح يحتوي الصور وقواعد الإضافات، حسابات بلا كلمات سر أو hashes، منع المندوب من تنزيل النسخ، ومقارنة كاملة أثبتت بقاء بيانات الأعمال وإصدارها كما هما قبل وبعد النسخ اليومي واليدوي السحابي.

ترحيل قاعدة البيانات الجديد ينشئ جدول معلومات النسخ فقط؛ لا يعدل أو يحذف جداول التشغيل الموجودة. خدمة النسخ السحابي محدودة إلى 20 MiB من البيانات والصور غير المضغوطة لضبط ذاكرة الخادم، والنسخ اليدوي السابق متاح كما هو. صلاحية رابط الاستضافة لم تتغير. مسار الخدمة خاص باستضافة owner-private ويجب تعطيله أو تأمينه بطريقة أخرى قبل توسيع جمهور الرابط؛ تعليمات التشغيل في BACKUP_AUTOMATION.md.

اختبار واجهات الموبايل والكمبيوتر بصريًا، وقارئ الباركود المادي، والطابعة المادية، والضغط الإنتاجي الممتد ما زال خارج النتائج المتحققة هنا.

## Sale-return approval (2026-10-06)

- Rep sale returns are pending documents. Original invoice returned quantities, inventory cost/stock, customer debt, cash and ledger remain unchanged until admin approval.
- Only admins approve/reject. Rejection requires a reason. One pending return per invoice prevents overlapping quantities and cent-rounding conflicts; review it before another return on that invoice.
- Approval rechecks original invoice quantities/frozen valuation, customer debt and available cash, then posts the existing document once under the existing revision/CAS transaction. Admin-created returns and historical approved documents retain their behavior.
- Pending/rejected returns are excluded from profit, product/rep sales, targets, customer statements/aging, commissions and rep-day totals. Approved rep returns use approval time for accounting; request time and reviewer remain visible.
- Verified: full seven-suite unit/report/Excel/ZIP regression, 100 partial carton return workflows with 1100 reconciliation assertions, TypeScript check and Worker build; isolated real local D1/R2 API suite including two simultaneous admin approvals (exactly one success), duplicate request/review, rejection, permissions and backup/restore.
- No hosted business data was restored or changed by the tests. Browser screen navigation and physical printer testing were not performed.

## Large backups, safe restore and automatic piece prices (2026-10-06)

- V2 freezes records/header/public accounts under one D1 batch, prepares at most one bounded part per request, resumes with a lease, publishes only completed manifests, reuses SHA-addressed image blobs, and streams stored ZIP downloads. Old v1 R2 ZIP downloads and v1 restore format remain supported.
- Admin restores stage verified parts independently, check completeness and original schema/reference rules, save a safety snapshot of the exact current revision, and atomically replace under the existing CAS gate plus active-job condition. New business writes, cancellation, corrupt parts, incomplete ZIPs/parts and duplicate rows refuse replacement. Commit and part-upload retries are idempotent. Current app accounts/passwords are retained.
- Limits: total ZIP 1 GiB; header/record bytes 20 MiB; image 5 MiB; record/header part 1 MiB; max 5000 parts; restore session 24 hours. Legacy browser imports remain bounded to 50 MiB including bounded decompression. These are explicit operational caps, not claims of testing every size up to 1 GiB.
- Verified all business/report/Excel/old backup/approval/credit/count/close/commission suites and TypeScript/Worker build. A real local D1/R2 fixture writes 13 distinct 5 MiB images, creates and streams a 65+ MiB backup, parses via File.slice (whole-archive reads forbidden), restores with unchanged financial state and exact image bytes/rep access, and verifies a 65+ MiB pre-restore safety backup. Hash, truncation, central-index corruption, missing-part, cancelled-job, live-write-conflict, duplicate-row and lost-final-response tests exercise refusal/retry paths.
- Automatic retail and wholesale piece prices: carton price / pack, rounded in cents. Form edits to carton/pack calculate only the applicable prices; piece prices remain editable. Server and Excel import derive omitted piece prices, while unrelated product edits preserve existing manual prices and historical invoices remain immutable.
- No production restore/load test or physical printer/scanner/browser click-through is represented by these local tests. Production verification only creates a backup copy and reads its metadata under the approved owner-private service path.


## Customer approval, dark theme and printable documents/statements (2026-10-06)

- A rep customerRequest stores sanitized contact data in a pending document; it never creates an active customer or changes stock/cash/debt/ledger/report state. Only an admin approval inserts exactly one zero-debt customer; rejection records a reason and leaves active lists unchanged. Active/pending code duplication is refused, and approval rechecks a code created by the admin after submission. App CAS/idempotency and the existing audit apply unchanged. New/old backup formats support and validate the new document; existing migrations and historical records are unchanged.
- Dark screen-only theme covers login, desktop/mobile work surfaces, dialogs, tables, inputs, popovers, buttons/statuses and notifications. Focus visibility and normal text/status contrast were checked; printed thermal receipts remain black on white paper. Theme/layout source was checked but not rendered in an agent browser.
- Admin printing is available on document rows and the full Reports → Documents list, including historical sales/purchases, returns, loads, car returns, deposits/proofs, collections, supplier payments, expenses, debt/stock adjustments, customer requests, stocktakes, day-close summaries and commission payouts. Existing thermal receipt print/share remains available. Print HTML escapes customer/user text, labels pending/rejected documents explicitly, and waits for attached image decoding; image/print preparation failures show an error rather than silently omitting proof.
- Customer statements use a separately authorized read-only endpoint to include the selected customer's posted transactions from ALL users, without widening the rep office/invoice list or exposing cost/other customers/suppliers. Supplier statements remain admin-only. Selected inclusive Cairo dates show legacy/opening balance, invoice gross/paid, collections, approved returns/refunds, debt adjustments, line details, running balance, period closing/current balance and debit/credit totals. The displayed/printed/exported statement is one snapshot; changing dates disables printing/export until the requested period is loaded, and stale request responses are ignored.
- Passed the full 10-suite unit/report/Excel/ZIP regression (including 100 workflows/1100 monetary checks), TypeScript and Worker build; isolated real D1/R2 API regression including 65+ MiB snapshot/restore, two simultaneous customer approvals (one success), rejection/resubmission, pre-approval sales/collections denial, foreign rep request isolation, live duplicate-code clash, legacy restore with pending/approved/rejected requests, complete cross-user statement rows, exact 700-cent final reconciliation, invalid/empty periods, authentication/role boundaries and no writes from statement reads. Print templates for every document type and text contrast >=4.5 were tested programmatically.
- These tests do not constitute browser click-through, a production restore/load test or physical printer/scanner verification. No test changed hosted business records. There is no absolute guarantee against every possible fault; the recorded checks cover the tested scenarios.

## Bulk customer-request approval (2026-10-06)

- Admin-only selection controls appear in Customers → Customer Requests and Approvals. Select all applies only to visible pending customer requests matching the search, and only selected visible requests are submitted. Load/deposit/return/count/close documents are never included. Individual approval remains unchanged.
- A sequential client flow reuses the existing per-item authenticated approve API, latest revision, exact request ID, server customer/code validation and user/time audit. Validation failure reports its reason and continues; stale revisions refresh/retry once; a lost reply retries the same idempotency token. Already reviewed requests are skipped. Connection failure stops further submissions and distinguishes an uncertain sent request from never-attempted requests. Buttons/checkboxes are disabled while processing; results and progress are displayed.
- Targeted unit and real D1 API tests select ten requests with a deliberately conflicting code: nine customers are created, one failure is reported, nine distinct approval audits are written, and existing stocks/cash/products/suppliers/ledger/targets/commissions stay unchanged. Duplicate IDs, repeated batch submission, other-document IDs, rep access, stale revision, disconnect and lost-successful-response replay are covered. Full regression, TypeScript and Worker build pass.
- No business schema/server mutation logic changes or migration are required. Browser click-through is unavailable under the current preview instructions; physical printer QA is unrelated to this change and was not performed. Actual hosted customer requests are never approved by the test suite.

## Owner-only forgotten admin credentials (2026-10-06)

- Login includes “Forgot main account credentials?” and a verified-owner form showing the existing admin username and two new-password fields. It never reads/returns an old plaintext password. A server-only configured owner email is taken from the verified Site owner's access record; authorization requires matching dispatch-authenticated email AND a non-empty Site-scoped subject. Body-supplied identities, bare app sessions, absent/service identities and rep sessions cannot recover the main account. The configured claim allowlist remains private and is not placed in source/hosting/browser code. Platform sign-in remains a required ownership factor; losing that platform account is outside this self-service path.
- GET produces a private no-store HMAC challenge keyed by the current password hash, bound to the Site-scoped subject, current business revision, nonce and ten-minute expiry. POST checks same-origin, verified identity, independent rate limit, confirmation/length, challenge/hash/revision, then updates hash/salt, revokes all main-account sessions and writes one audit under the existing atomic CAS gate. A new hash invalidates prior challenges; concurrent requests have one winner. Current financial records, documents, rep users/passwords and rep sessions remain intact. No DB migration is required.
- Token tests cover tampering/expiry/wrong subject/new revision/new hash/missing owner claims. Isolated API tests cover owner-only username disclosure, foreign/missing identity and rep-session denial, CSRF, bad confirmation/length/challenge, live revision conflict, concurrent reset, replay, old-session/old-password denial and successful new-password login with exact business-state comparison and one audit. Full regression/TypeScript/Worker build are also run.
- Actual hosted admin credentials are not reset by tests or deployment. Production owner browser sign-in/challenge interaction is not tested by the unavailable browser QA tool; dispatch behavior is implemented according to the platform authentication reference. Non-user service requests must be rejected by the recovery endpoint. Runtime owner configuration must be updated by a verified owner if the platform owner's email changes; missing/mismatched configuration fails closed.

## Opaque searchable selection menus and nested-dialog scrolling (2026-10-06)

- Shared Picker now uses the installed Radix modal Popover. Its own RemoveScroll boundary admits wheel/touch scrolling within the portaled menu while an enclosing Dialog remains locked, rather than disabling dialog scroll protection or adding global event overrides. Existing cmdk search values, selected record IDs, onSelect mutation callback, keyboard navigation, Escape dismissal and focus return remain provided by the same primitives.
- Scoped explicit opaque menu/command backgrounds, border/shadow and z-index remove dependence on unresolved bg-popover theme utilities and prevent underlying form text from showing through. Search has a stable, non-shrinking header sized for the 44px input; the independently scrollable result area fits the available viewport height with contained overscroll and touch pan. Rows wrap long names, show code on a separate line and highlight the current selection. Shared Choice menus also receive opaque scoped styling. Built CSS includes these rules. No vendored UI primitive, business action, API, schema, migration, stock/cash/debt calculation or authentication code changes.
- Full 12-suite unit/report/workflow/Excel/backup regression (100 scenarios/1100 reconciliation assertions), TypeScript, Worker build and isolated D1/R2 API regression passed after the change, including 65+ MiB backup/restore, invoice idempotency/concurrency, return/customer approvals, statements and owner recovery. New menu text/background contrast measured 5.39:1 to 15.66:1, meeting 4.5:1 for every checked normal/selected/name/code/input pair. Hosted financial records are never used as test fixtures.
- No claim of actual mouse-wheel, touch, keyboard or visual browser verification: the mandated control-browser skill remains unavailable. Native browser behavior and device-specific layout must still be checked in the user's browser. Successful automated business checks/build do not prove every UI interaction or guarantee zero defects.

## Inventory screen hides zero-balance rows (2026-10-07)

- The warehouse/car table filters products using the balance at the currently selected location before rendering. Missing and exact-zero balances are hidden; a nonzero balance in another location does not make the item visible here. The admin defaults to warehouse and rep to their car as before. Product catalogs, invoice pickers, stock/cash/debt state, reports, permissions, APIs and stored records remain unchanged. Empty locations get specific explanatory text rather than a table full of zeros.
- Evaluated the actual JSX row expression with hand-built warehouse/car fixtures: admin warehouse default, explicit car, rep car default, rep warehouse selection, empty/missing location, carton/remainder values and unchanged source state/product count all pass. Full 12-suite business/report/import/backup regression, TypeScript, Worker build and isolated D1/R2 API regression passed. One initial local API run was interrupted by Wrangler's explicit “worker restarted mid-request” response; a fresh full run passed, including large backup/restore. This is recorded as a local test-environment interruption, not evidence of a hosted outage.
- The reports test fixture previously fixed only creation timestamps while return approval posting time used the wall clock. After Cairo midnight, the empty-period assertion picked up the approved return. The fixture now fixes existing postedAt alongside at; production report/date logic is unchanged. Cairo boundary assertions and frozen historical profit checks still pass.
- No browser click-through test was performed because the required browser-control capability is unavailable. No hosted company data was restored or edited by the tests.

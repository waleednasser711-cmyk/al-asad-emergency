# Report export

The report toolbar offers Excel and PDF. Excel downloads a real `.xlsx` workbook. PDF uses the established isolated print-frame helper and the browser's save-to-PDF destination; it is not an automatic PDF download and does not require a physical printer.

Report buttons match the sidebar navigation: gold selection with dark text, the same rounded corners and padding, a dark hover state, and the same width/height/padding transition. Native Radix selection and keyboard focus remain intact. The current report name is displayed above the tabs. Styling is scoped to report tabs, without changing the rest of the office theme.

Export takes a snapshot of the current report and uses the same existing calculation functions and filters. All nine reports are supported. Excel uses numeric cells for quantities, amounts and percentages; names and codes remain text without formulas. A second sheet records report metadata and applicable filters. Current inventory and balances remain current rather than implying historical values for a selected date. PDF output escapes all text, uses RTL Arabic, A4 orientation by table width, repeating headers and black text on white paper.

No financial calculations, persistence operations or permissions change. CSV statement export and all invoice/statement printing are unchanged. Tests serialize and reopen real XLSX workbooks for all report types and check print HTML, filter metadata, empty results, formula/text safety and nonmutation; run-suite and run-api cover existing accounting and backups. Physical printer and device dialogs require the user's browser.

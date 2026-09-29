# White Horse user guide

## 1. Scope and disclaimer

This release supports a Schedule III Division I standalone-company workflow for non-Ind AS commercial or industrial companies. It does not claim coverage of Division II, Division III, consolidated reporting, banking, insurance, another regulated sector, every amendment, or every entity-specific disclosure. Validate all classifications and disclosures against current authoritative requirements and engagement-specific facts.

The preloaded Saffron Industries Private Limited workspace is synthetic.

## 2. Workspace model

White Horse stores data inside IndexedDB in the browser. One browser profile can contain multiple independent company workspaces. A created company remains after ordinary reloads, browser restarts, and application deployments when the same White Horse URL and browser profile are used. Opening the public URL on another browser, profile, device, or origin creates a separate local database. There is no automatic cloud synchronisation.

Company Setup displays whether the browser reports `PERSISTENT`, `BEST EFFORT`, or an unavailable/unsupported persistence state. Use **Protect browser storage** where available, but do not treat it as a backup: explicit site-data deletion still removes persistent browser storage. Use an encrypted backup to recover work or move a controlled database between browsers.

## 3. Recommended workflow

### Company and period

Select the company switcher in the top bar to change workspaces. Use **Company setup → New company** to create a separate company and reporting period. Confirm the legal name, trade name, CIN, registered office, industry, display scale, period, comparative period, and materiality before importing data. CIN is normalised to uppercase alphanumeric and must contain exactly 21 characters in the standard `L/U + 5 digits + 2 letters + 4-digit year + 3 letters + 6 digits` structure. This is a local syntax check; verify the identifier and company details against MCA master data. Comparative dates must be valid, internally ordered, and end before the current period begins. This workflow creates a blank workspace with 30 Division I note workpapers and an explicit blocking control until a Trial Balance is activated.

Use **Edit setup** to correct the active company/period. Use **Add local user** or a user's settings control to maintain browser-local role records. These roles are workflow metadata, not production authentication or access control.

### Trial Balance

1. Export a ledger-level Trial Balance from Tally, SAP, Zoho, Busy, QuickBooks, or another accounting package as `.xlsx`, `.csv`, `.tsv`, or delimited `.txt`. Use amounts in INR, not lakhs or crores.
2. Select **Import Trial Balance** and choose the export. White Horse scans candidate XLSX worksheets (excluding clearly named instruction/example/sample sheets from automatic selection), the first 50 rows for a header, common one-row/two-tier headers, and several balance layouts. Any worksheet can still be selected explicitly.
3. Review the detected worksheet, header row/depth, sample ledgers, warnings, debit/credit totals, and difference. `STANDARD FORMAT` confirms exact `WH-TB-1.0`; `ADAPTIVE IMPORT READY` means a compatible vendor layout was recognised.
4. If **MAPPING REQUIRED** appears, open **Review mapping**. Map Ledger Name and either Closing Debit + Closing Credit, one Signed Closing Balance, or Period Debit + Period Credit. Ledger Code, group/sub-group, and comparatives are optional. Select a debit-positive or credit-positive convention when a signed balance has no Dr/Cr information.
5. White Horse can generate source-row ledger codes, skip blank/title/narration rows with no balances, and exclude exact total rows. Treat each such action as a review warning—not as an accounting conclusion.
6. Activate only an error-free, non-empty Trial Balance whose closing debit and credit totals agree exactly in paise. Confirm that preview totals reconcile to the source system.
7. Activation creates a new immutable import version and retains the former import as superseded.
8. For repeatable client onboarding, select **Standard TB template** and use these row-1 headers: `Ledger Code`, `Ledger Name`, `Group`, `Subgroup`, `Closing Debit`, `Closing Credit`, `Previous Debit`, `Previous Credit`.

The import dialog contains three **Verified sample** downloads: Meridian Manufacturing, BluePeak Digital Services, and GreenTrail Foods. Each workbook is balanced, uses different synthetic ledger data, and imports as the exact standard format without manual mapping. Use them to test the workflow; do not treat their classifications as an engagement template.

Scanned/image PDFs, legacy `.xls`, password-protected or corrupt workbooks, macros, and proprietary accounting database files are outside the adaptive tabular-import boundary. Convert those to a supported export first. The browser does not upload the TB to an application server.

The repository includes `samples/white-horse-tb-template.csv` as the header-only standard format and `samples/saffron-trial-balance.csv` as a populated synthetic demonstration. See `docs/TRIAL_BALANCE_IMPORT_FORMAT.md` for the source-to-standard conversion table, aliases, optional movement/opening columns, limits, and control rules.

### Mapping

Review every suggestion. Confirm taxonomy head, current/non-current classification, cash-flow class, and mapping status. Suggested mappings are not approvals. All active ledgers must be mapped, then use **Review & lock mapping version** before finalisation.

### Adjustments

Enter a reference, date, type, narration, workpaper reference, and at least two journal lines. Debits must equal credits exactly in paise. Submit for review; a reviewer can approve/post or reject with an explicit comment. Only posted adjustments affect statements.

### Review and validation

Select **Run all validations** after imports, mappings, or adjustments change. Investigate blocking/error results first, then warnings. Record a resolution or explicit acceptance against persisted observations. Automated exceptions disappear only when their underlying data is corrected.

### Statements and notes

Use statement tabs for Balance Sheet, Profit and Loss, and Cash Flow. Select an enabled line to trace its presented value to source ledgers and posted adjustments. Complete all applicable items in the 30-note workbench; the PDF note schedules show ledger-level current/comparative amounts, include posted adjustments, and reconcile to the corresponding face-statement total. Credit-normal schedules are presented as positive disclosure amounts.

The PPE and intangible notes show only a defensible net carrying-amount bridge from comparative closing amount to current closing amount when the Trial Balance does not contain asset-register movements. White Horse deliberately does not invent gross block, additions, disposals, depreciation, impairment, or class-wise register information. Complete those disclosures from the fixed-asset register and approved workpapers before marking the note complete. A note cannot be marked Complete until its three review checklist items are selected. Mark genuinely non-applicable disclosures deliberately rather than leaving them blank.

### Reports and exports

- **Export CSV** downloads the active Trial Balance in a re-importable layout.
- **Generate complete financials** produces an 11-sheet XLSX: Cover, Balance Sheet, Profit and Loss, Cash Flow, Notes to Accounts, Ratios, Trial Balance, Mapping, Adjustments, Validation, and Audit Trail.
- **Export ratio schedule** downloads all 12 analytical ratios as CSV. An unavailable denominator or missing principal-repayment input is reported as `N/A`, not zero.
- **PDF & signatures** stores optional signing-block settings for the active company and reporting period. The Director block prints at the lower left with name, designation, and eight-digit DIN. The Chartered Accountant block prints at the lower right with capacity, firm, signing CA, designation, and six-digit ICAI membership number; FRN and UDIN are optional. Each side can be shown or hidden independently.
- **Export PDF** opens the browser print dialog for a six-section A4 pack: cover, Balance Sheet, Statement of Profit and Loss, Cash Flow Statement, Notes to Accounts, and ratio schedule. Choose **Save as PDF** in the browser. The professional A4 layout repeats note headers on continuation pages, keeps amount columns aligned, avoids splitting individual note schedules where practical, and places the signing blocks on the three face statements when enabled.

The signing controls print text and an unsigned signature line only. They do not apply a scanned, electronic, or digital signature and do not create an auditor's report. Confirm the signatories required for the entity and period, verify DIN/membership/UDIN against authoritative records, and attach the applicable auditor's report before statutory use. Signature settings are frozen with other reporting-period data after finalisation.

Generated reports are drafts until the finalisation controls pass and an authorised reviewer approves them.

### Backup and restore

Create an encrypted backup before material changes and finalisation. Use a strong unique passphrase and store it separately. Restore replaces the current local White Horse database only after the file and integrity metadata validate. Test recovery periodically in a separate browser profile.

### Finalisation

Finalisation requires balanced Trial Balance, complete/locked mappings, no unposted adjustments, balanced statements and cash flow, completed required notes, and no unresolved blocking/error/warning observations. Finalisation freezes the reporting-period state and appends an audit event; reopen controls are an extension point for a production release.

## 4. Removing local data

Use **Reset synthetic demo** only when you intentionally want to discard the local workspace and recreate the bundled demonstration. Alternatively, clear site data in the browser. Export a verified encrypted backup first if the workspace must be recoverable.

## 5. Common issues

| Symptom | Likely cause | Safest action |
| --- | --- | --- |
| Trial Balance activation disabled | Errors, non-zero difference, or confirmation not selected | Correct the source file; do not force activation |
| Import shows `MAPPING REQUIRED` | The vendor headings or balance sign convention are ambiguous | Select the worksheet/header, map the semantic columns, choose the sign convention if requested, then validate again |
| A scanned PDF or old `.xls` will not import | It is not a supported tabular source | Export the TB as `.xlsx`, `.csv`, `.tsv`, or delimited `.txt`; reconcile totals before activation |
| Mapping gate remains open | One or more active ledgers are unmapped or not locked | Review and approve every ledger mapping |
| Finalisation blocked | Submitted adjustment, incomplete note, or open validation | Resolve the underlying item and retain evidence |
| Data missing on another device | Browser-local storage is intentionally isolated | Transfer a verified encrypted backup |
| Company missing after clearing browser data or closing a private session | IndexedDB for the White Horse origin was deleted | Restore a verified encrypted backup; persistent-storage mode cannot override explicit deletion |
| Site loads while offline but badge says online | Browser network status can remain online while the origin server is unavailable | Treat successful cached reload as shell availability; reconnect before expecting application updates |
| A deployed update is available but an old screen remains open | The service worker preserves the current shell until it is safe to update | Save/export work, select **Update** when prompted, or close and reopen the site; do not clear site data unless a backup exists |
| Complete-financials export is blocked | No active TB or one or more ledgers are unmapped | Activate a balanced TB, complete mapping, then generate again |
| PDF button opens a print dialog instead of downloading immediately | PDF generation uses the browser's standards-based print engine | Choose **Save as PDF**, select the destination, and review the saved document before circulation |

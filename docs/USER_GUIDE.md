# White Horse user guide

## 1. Scope and disclaimer

This release supports a Schedule III Division I standalone-company workflow for non-Ind AS commercial or industrial companies. It does not claim coverage of Division II, Division III, consolidated reporting, banking, insurance, another regulated sector, every amendment, or every entity-specific disclosure. Validate all classifications and disclosures against current authoritative requirements and engagement-specific facts.

The preloaded Saffron Industries Private Limited workspace is synthetic.

## 2. Workspace model

White Horse stores data inside the browser. One browser profile can contain multiple independent company workspaces. Opening the public URL on another browser or device creates a separate local database. There is no automatic cloud synchronisation. Use an encrypted backup to move a controlled database between browsers.

## 3. Recommended workflow

### Company and period

Select the company switcher in the top bar to change workspaces. Use **Company setup → New company** to create a separate company and reporting period. Confirm the legal name, trade name, CIN, registered office, industry, display scale, period, comparative period, and materiality before importing data. This workflow creates a blank workspace with 30 Division I note workpapers and an explicit blocking control until a Trial Balance is activated.

Use **Edit setup** to correct the active company/period. Use **Add local user** or a user's settings control to maintain browser-local role records. These roles are workflow metadata, not production authentication or access control.

### Trial Balance

1. Select **TB import format** and download the CSV or XLSX template.
2. Delete both example rows and use these exact row-1 headers, in order: `Ledger Code`, `Ledger Name`, `Group`, `Subgroup`, `Closing Debit`, `Closing Credit`, `Previous Debit`, `Previous Credit`.
3. Enter positive amounts in INR, not lakhs or crores. Use either the debit or credit column for a balance, never both. Do not add total rows, formulas, macros, or merged cells.
4. Select **Import Trial Balance** and choose `.xlsx` or `.csv` up to 25 MB and 50,000 data rows. For XLSX, put the table on the first worksheet.
5. Review recognised columns, row errors, comparative warnings, debit/credit totals, and content hash.
6. Activate only an error-free, non-empty Trial Balance whose closing debit and credit totals agree exactly in paise.
7. Activation creates a new immutable import version and retains the former import as superseded.

The repository includes `samples/white-horse-tb-template.csv` as the prescribed blank-company format and `samples/saffron-trial-balance.csv` as a populated synthetic demonstration. See `docs/TRIAL_BALANCE_IMPORT_FORMAT.md` for aliases, optional movement/opening columns, limits, and control rules.

### Mapping

Review every suggestion. Confirm taxonomy head, current/non-current classification, cash-flow class, and mapping status. Suggested mappings are not approvals. All active ledgers must be mapped, then use **Review & lock mapping version** before finalisation.

### Adjustments

Enter a reference, date, type, narration, workpaper reference, and at least two journal lines. Debits must equal credits exactly in paise. Submit for review; a reviewer can approve/post or reject with an explicit comment. Only posted adjustments affect statements.

### Review and validation

Select **Run all validations** after imports, mappings, or adjustments change. Investigate blocking/error results first, then warnings. Record a resolution or explicit acceptance against persisted observations. Automated exceptions disappear only when their underlying data is corrected.

### Statements and notes

Use statement tabs for Balance Sheet, Profit and Loss, and Cash Flow. Select an enabled line to trace its presented value to source ledgers and posted adjustments. Complete all applicable items in the 30-note workbench; mapped current/comparative amounts are shown alongside the narrative. A note cannot be marked Complete until its three review checklist items are selected. Mark genuinely non-applicable disclosures deliberately rather than leaving them blank.

### Reports and exports

- **Export CSV** downloads the active Trial Balance in a re-importable layout.
- **Generate complete financials** produces an 11-sheet XLSX: Cover, Balance Sheet, Profit and Loss, Cash Flow, Notes to Accounts, Ratios, Trial Balance, Mapping, Adjustments, Validation, and Audit Trail.
- **Export ratio schedule** downloads all 12 analytical ratios as CSV. An unavailable denominator or missing principal-repayment input is reported as `N/A`, not zero.
- **Print / PDF** uses the browser's print dialog and print stylesheet.

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
| Mapping gate remains open | One or more active ledgers are unmapped or not locked | Review and approve every ledger mapping |
| Finalisation blocked | Submitted adjustment, incomplete note, or open validation | Resolve the underlying item and retain evidence |
| Data missing on another device | Browser-local storage is intentionally isolated | Transfer a verified encrypted backup |
| Site loads while offline but badge says online | Browser network status can remain online while the origin server is unavailable | Treat successful cached reload as shell availability; reconnect before expecting application updates |
| A deployed update is available but an old screen remains open | The service worker preserves the current shell until it is safe to update | Save/export work, select **Update** when prompted, or close and reopen the site; do not clear site data unless a backup exists |
| Complete-financials export is blocked | No active TB or one or more ledgers are unmapped | Activate a balanced TB, complete mapping, then generate again |

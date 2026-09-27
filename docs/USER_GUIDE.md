# White Horse user guide

## 1. Scope and disclaimer

This release demonstrates a Schedule III Division I-oriented standalone-company workflow. It does not claim complete coverage of every entity type, accounting framework, amendment, disclosure, audit requirement, or regulator expectation. Validate all classifications and disclosures against current authoritative requirements and engagement-specific facts.

The preloaded Saffron Industries Private Limited workspace is synthetic.

## 2. Workspace model

White Horse stores data inside the browser. Opening the public URL on another browser or device creates a separate local demo workspace. There is no automatic cloud synchronisation. Use an encrypted backup to move a controlled workspace between browsers.

## 3. Recommended workflow

### Company and period

Confirm the legal name, CIN, registered office, industry, reporting framework, currency, period, comparative period, materiality, taxonomy version, and rule-set version before importing data.

### Trial Balance

1. Select **Import Trial Balance**.
2. Choose `.xlsx` or `.csv` up to 25 MB and 50,000 data rows.
3. Review recognised columns, row errors, comparative warnings, debit/credit totals, and content hash.
4. Activate only an error-free, non-empty Trial Balance with a zero-paise difference.
5. Activation creates a new immutable import version and retains the former import as superseded.

The repository includes `samples/saffron-trial-balance.csv` for demonstrations. It contains only synthetic data.

### Mapping

Review every suggestion. Confirm taxonomy head, current/non-current classification, cash-flow class, and mapping status. Suggested mappings are not approvals. All active ledgers must be mapped and locked before finalisation.

### Adjustments

Enter a reference, date, type, narration, workpaper reference, and at least two journal lines. Debits must equal credits exactly in paise. Submit for review; a reviewer can approve/post or reject with an explicit comment. Only posted adjustments affect statements.

### Review and validation

Investigate blocking/error results first, then warnings. Record a resolution or explicit acceptance against persisted observations. Automated exceptions disappear only when their underlying data is corrected.

### Statements and notes

Use statement tabs for Balance Sheet, Profit and Loss, and Cash Flow. Select an enabled line to trace its presented value to source ledgers and posted adjustments. Complete applicable notes and policies; mark non-applicable disclosures deliberately rather than leaving them blank.

### Reports and exports

- **Export CSV** downloads the active Trial Balance in a re-importable layout.
- **Export workbook** produces Balance Sheet, Profit and Loss, Cash Flow, Trial Balance, mapping, adjustments, ratios, and validation sheets.
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

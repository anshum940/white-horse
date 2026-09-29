# White Horse Report Catalogue and Formats

## 1. Current implemented report controls

The one-click XLSX cover records:

- Company legal name, trade name, CIN, registered office, and industry.
- Standalone Schedule III Division I framework scope.
- Reporting period and comparative period.
- Framework/taxonomy/ruleset versions.
- Draft/review/final period status and generated timestamp.
- A professional-use warning requiring completion of applicable accounting-standard, Companies Act, Schedule III, sector-specific, and entity-specific disclosures.

Face-statement values support ledger/adjustment drill-down in the application. The workbook retains exact INR values while the application can display rupees, thousands, lakhs, or crores.

## 2. Statutory-oriented financial statements

### 2.1 Balance Sheet

Vertical Schedule III-oriented layout:

```text
I.  Equity and liabilities
    1. Shareholders' funds / Equity
    2. Share application money pending allotment (where applicable)
    3. Non-current liabilities
    4. Current liabilities
II. Assets
    1. Non-current assets
    2. Current assets
```

Columns: Note number, current reporting date, comparative reporting date. Exact labels are controlled by the selected taxonomy version.

The shared report model deliberately presents Equity and Liabilities before Assets. This ordering is consistent in the application, XLSX output and printable financial pack; it does not alter calculation, drill-down or the balance-sheet reconciliation equation.

### 2.2 Statement of Profit and Loss

Vertical layout with revenue from operations, other income, total income, expense classes, profit before exceptional/prior-period/tax items, tax expense, profit after tax, and earnings-per-share placeholders where applicable/configured.

### 2.3 Cash Flow Statement

Indirect-method operating, investing, and financing sections; net movement; opening and closing cash; cash and cash-equivalent composition; non-cash movement disclosures.

### 2.4 Statement of Changes in Equity

Component-wise opening balance, prior-period correction/restatement, owner transactions, current-period profit/other changes, transfers, and closing balance. Rendered only when applicable/configured.

## 3. Notes and disclosure outputs

- Corporate information.
- Basis of preparation and significant accounting policies.
- Share capital and promoter shareholding schedules.
- Reserves/equity movement.
- Borrowings and maturity/security/default detail.
- Property, plant and equipment and intangible movement schedules.
- Investments, inventory, receivables, cash/bank, loans, other assets/liabilities.
- Revenue and expense breakdowns.
- Tax, deferred tax, related parties, commitments/contingencies, MSME, ageing, ratios, and other configured disclosures.
- Disclosure checklist showing Complete / Not applicable / Pending, owner, evidence, and review status.

The current release provides 30 structured note workpapers, factual automatic company disclosures, ledger-level current/comparative schedules, posted-adjustment inclusion, face-statement reconciliation, status, owner, narrative, and review checklists. Credit-normal schedules are displayed as positive disclosure values. Where no underlying ledgers exist, the report uses the matching face-statement line as a controlled fallback rather than suppressing the note.

Automatic text may assert only facts carried by the selected company, period, Trial Balance, mappings, comparative balances and posted adjustments. Corporate identity and period text is populated directly from company master data. Balance notes state their calculated current/comparative amounts, mapped-ledger count and factual movement. `NO_BALANCE` explicitly preserves the need for an applicability assessment. Regulatory and ratio notes use `REQUIRES_WORKPAPER` when the necessary evidence is not present. The generator never invents accounting policies, ageing buckets, promoter holdings, title-deed exceptions, defaults, contingencies, related parties, legal proceedings or other non-ledger facts.

For PPE and intangible assets, a Trial Balance alone ordinarily provides closing net carrying amounts rather than the complete fixed-asset-register movement data. White Horse therefore presents a mathematically reconciling net carrying-amount bridge (comparative closing amount plus net Trial Balance movement equals current closing amount) and an explicit completion requirement. It does not fabricate gross carrying amount, additions, disposals, depreciation, impairment, class-wise lives, title restrictions, revaluation, CWIP ageing, or other register-dependent disclosures.

## 4. Control and reconciliation reports

1. TB import control report.
2. Duplicate/unusual ledger report.
3. Unmapped and mapping-change report.
4. Imported → mapped TB reconciliation.
5. Adjustment register and workpaper impact report.
6. Mapped → adjusted TB reconciliation.
7. Adjusted TB → statements reconciliation.
8. Note-to-face reconciliation.
9. P&L-to-equity bridge.
10. Cash-flow reconciliation.
11. Validation exception and override report.
12. Review comment and sign-off report.
13. Audit trail and finalisation manifest.

## 5. Management and stakeholder packs

### Board Pack

- Cover and reporting status.
- Executive summary.
- Revenue, EBITDA, EBIT, PAT, cash, debt, net worth, and working capital KPIs.
- Current/prior variance waterfall and management commentary.
- Liquidity, leverage, profitability, and return ratios.
- Key risks, control exceptions, and decisions required.
- Condensed statements and selected supporting schedules.

### Bank Financial Information Pack

- Company and facility overview fields.
- Audited/provisional status.
- Balance Sheet, P&L, cash flow, and comparative trend.
- Debt profile, security/charge placeholders, repayment and interest coverage.
- Working-capital build-up, current ratio, debt-equity, DSCR, receivable/inventory ageing.
- Covenant/user-defined ratio schedule and explanations.
- Supporting TB/mapping/adjustment reconciliation manifest.

## 6. One-click Excel pack

**Generate complete financials** creates these worksheets in order:

1. Cover
2. Balance Sheet
3. Profit and Loss
4. Cash Flow
5. Notes to Accounts
6. Ratios
7. Trial Balance
8. Mapping
9. Adjustments
10. Validation
11. Audit Trail

Generation is blocked if no Trial Balance is active or any active ledger is unmapped. The ratio sheet contains 12 transparent calculations. DSCR remains `N/A` until principal-repayment data is available.

## 7. Complete browser PDF pack

**Export PDF** opens the browser print dialog for an A4 pack containing a cover, Balance Sheet, Statement of Profit and Loss, Cash Flow Statement, Notes to Accounts (including automatic company disclosures and workpaper status), and analytical ratio schedule. The user chooses **Save as PDF** and reviews the resulting file. The print stylesheet uses professional type hierarchy, aligned comparative columns, repeated note-pack headers on continuation pages, controlled page breaks, and a compact Balance Sheet signing area so enabled Director/CA blocks remain with the statement. Browser print was selected to keep generation local, standards-based, accessible, and dependency-light; pixel-identical output across browser engines is not guaranteed.

Each face statement can show an optional Director block at lower left and Chartered Accountant block at lower right. The settings belong to the reporting period and each block can be hidden independently. The output is an unsigned text/signature-line placeholder, not a handwritten/electronic/digital signature or an auditor's report.

## 8. Trial Balance import/export format

The preferred repeatable `WH-TB-1.0` columns are:

```text
Ledger Code, Ledger Name, Group, Subgroup, Closing Debit, Closing Credit, Previous Debit, Previous Credit
```

Values are INR amounts. One closing side is populated per ledger, and total closing debits must equal total closing credits. The adaptive importer also accepts XLSX/CSV/TSV/delimited TXT vendor exports, scans worksheets/header rows, recognises separate and signed balance layouts, and exposes a manual semantic column mapper when detection is ambiguous. See `docs/TRIAL_BALANCE_IMPORT_FORMAT.md` for the complete layouts, limits, aliases, and review controls.

## 9. Export formats

| Format | Use | Implementation rule |
| --- | --- | --- |
| Print/PDF | Complete financial statement pack | Six-section A4 print pack; browser **Save as PDF**; optional unsigned Director/CA text blocks; repeat headers and avoid clipped tables |
| XLSX | Working papers and editable schedules | Separate sheets, formulas only where safe, values and control totals, freeze panes, filters, styles |
| CSV | TB, mapping, adjustment, validation, audit extracts | UTF-8 with BOM option; explicit column schema and ISO dates |
| JSON backup | Full-fidelity backup/restore | Versioned manifest, integrity hash, optional authenticated encryption |
| HTML in-app | Drill-down and review | Accessible tables, provenance links, no raw imported HTML |

## 10. Naming convention

```text
WhiteHorse_<CompanyCode>_<PeriodEnd>_<ReportType>_<Status>_v<Revision>_<YYYYMMDD-HHmm>.<ext>
```

File names exclude sensitive full legal names by default and are sanitised for Windows/macOS compatibility.

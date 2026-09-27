# White Horse Report Catalogue and Formats

## 1. Common report controls

Every formal output contains:

- Company legal name and CIN where configured.
- Standalone/consolidated indicator (standalone in the initial release).
- Report title, reporting date/period, comparative period, currency, and display scale.
- Framework/taxonomy/ruleset versions.
- Draft/final status and report-run ID.
- Generated timestamp and user.
- Preparer/reviewer/finaliser details where applicable.
- Page numbering, confidentiality label, and a footer stating that professional review remains required.
- Dataset and output hash in the export manifest, not visually cluttering the face statements.

All statement and note figures support drill-down in the application. Printed exports contain note cross-references and supporting schedules.

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

The initial release provides structured placeholders and mapped totals; specialised disclosure content requires preparer input and reviewer approval.

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

## 6. Export formats

| Format | Use | Implementation rule |
| --- | --- | --- |
| Print/PDF | Board, bank, statutory-oriented presentation | Dedicated print CSS; user prints to PDF; repeat headers and avoid clipped tables |
| XLSX | Working papers and editable schedules | Separate sheets, formulas only where safe, values and control totals, freeze panes, filters, styles |
| CSV | TB, mapping, adjustment, validation, audit extracts | UTF-8 with BOM option; explicit column schema and ISO dates |
| JSON backup | Full-fidelity backup/restore | Versioned manifest, integrity hash, optional authenticated encryption |
| HTML in-app | Drill-down and review | Accessible tables, provenance links, no raw imported HTML |

## 7. Naming convention

```text
WhiteHorse_<CompanyCode>_<PeriodEnd>_<ReportType>_<Status>_v<Revision>_<YYYYMMDD-HHmm>.<ext>
```

File names exclude sensitive full legal names by default and are sanitised for Windows/macOS compatibility.

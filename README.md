# White Horse

White Horse is a local-first, multi-company financial-statement preparation workspace for Indian companies. This release implements a Schedule III Division I workflow for standalone non-Ind AS commercial or industrial companies. The public site starts with synthetic demonstration data, and users can create independent company workspaces in their own browser.

**Live HTTPS demo:** https://anshum940.github.io/white-horse/

**Study access:** username `admin`, password `admin123`.

The login is a polished client-side cover for the public study demo, not a security boundary. Because GitHub Pages serves a public static application, a determined visitor can inspect or bypass client code. Do not place confidential data behind this demo credential. Commercial production requires server-enforced identity, secure sessions, tenant authorisation, protected APIs, rate limiting, monitoring, and recovery controls.

> **Important:** White Horse is a preparation and study aid, not a substitute for professional judgement, statutory audit, legal advice, or an up-to-date disclosure checklist. The supplied demo must not be used for statutory filing.

## What it demonstrates

- Adaptive XLSX/CSV/TSV/TXT Trial Balance preview, worksheet/header detection, manual column mapping, validation, versioned activation, and source-row traceability
- A vendor-neutral, eight-column Standard TB template (`WH-TB-1.0`) in CSV and XLSX for the most repeatable import path
- Three end-to-end-reconciled `WH-TB-1.0` sample workbooks for manufacturing, digital services, and food distribution demonstrations
- Independent company workspaces, reporting periods, materiality settings, display scales, and local role records
- A branded White Horse study-access cover, tab-scoped access marker, sign-out, and an explicitly labelled public-demo security boundary
- One-click light/dark mode on the login cover and workspace top bar, with a browser-local preference and paper-white statement/PDF presentation
- 21-character CIN format controls, non-overlapping comparative periods, and current financial-year defaults
- Ledger-to-taxonomy mapping with current/non-current and cash-flow classifications
- Balanced adjustment journals with preparer/reviewer states and workpaper references
- Deterministic Balance Sheet, Profit and Loss, and indirect Cash Flow statements, with Equity and Liabilities presented before Assets
- Thirty structured notes/disclosure workpapers, factual company/data-derived disclosure text, ledger-level comparative schedules, truthful PPE/intangible net carrying-amount bridges, and twelve transparent analytical ratios
- Blocking comparative-TB, duplicate-mapping, malformed-journal, orphan-ledger, and comparative-Balance-Sheet controls in addition to current-period reconciliations
- Comparative notes, review rules, finalisation gates, and hash-linked audit events
- One-click 11-sheet Excel pack, CSV extracts, a six-section A4 browser PDF pack, optional one- or two-Director/CA unsigned signing blocks, plain backup, and PBKDF2/AES-GCM encrypted backup flows
- IndexedDB persistence and a service-worker application shell for offline use
- A global, once-confirmed factory reset that atomically removes every browser-local workspace and restores only the synthetic demonstration

## Trial Balance import

White Horse first attempts to understand the accounting export directly. It scans candidate worksheets and the first 50 rows for a probable table header, while excluding clearly named instruction/example/sample sheets from automatic selection, recognises common account/ledger aliases, supports one-row and two-tier headers, and handles separate debit/credit columns, opening-plus-movement layouts, signed balances, and Dr/Cr indicators. If a vendor uses unknown headings, **Review mapping** lets the preparer assign the columns without changing the source file. A ledger code is optional; White Horse generates a source-row code and warns the preparer when one is absent.

Accepted tabular files are `.xlsx`, `.csv`, `.tsv`, and delimited `.txt`. Scanned PDFs, legacy binary `.xls`, password-protected/corrupt workbooks, macros, and proprietary accounting database files are not silently interpreted. Convert those to a tabular export first. White Horse never guesses whether an unsigned balance is debit-positive or credit-positive; the preparer must select that convention.

For controlled and repeatable onboarding, the preferred `WH-TB-1.0` format uses these headers on row 1:

Use these exact headers on row 1, in this order:

```text
Ledger Code, Ledger Name, Group, Subgroup, Closing Debit, Closing Credit, Previous Debit, Previous Credit
```

Amounts must be in INR, not lakhs or crores, and closing debits must equal closing credits exactly. The adaptive importer skips blank/title rows and exact total rows, but the preview and totals must still be reviewed before activation. Download [the source-controlled CSV template](samples/white-horse-tb-template.csv) or read the complete [Trial Balance import specification](docs/TRIAL_BALANCE_IMPORT_FORMAT.md). The application provides both templates and three verified demonstration workbooks from **Trial Balance → Import Trial Balance**. The standard XLSX keeps the blank import sheet separate from its instructions and worked example.

Verified synthetic workbooks: [Meridian Manufacturing](public/samples/Sample_Meridian_Manufacturing_TB_FY2025-26.xlsx), [BluePeak Digital Services](public/samples/Sample_BluePeak_Digital_Services_TB_FY2025-26.xlsx), and [GreenTrail Foods](public/samples/Sample_GreenTrail_Foods_TB_FY2025-26.xlsx). Each uses different ledger data and contains a separate instructions sheet.

The sample tests verify mapped Balance Sheets and current-year cash flow, not merely a balanced raw TB. Each workbook's Instructions sheet states the assumptions required for its zero-input demo scenario. A two-year closing TB does not establish the earlier year's cash-flow movements, so White Horse marks an unsupplied comparative cash-flow column unavailable rather than reporting false zeros. Director signing settings now allow an additional named Director and distinct eight-digit DIN; these remain unsigned placeholders, not an electronic signature or Board approval.

## Data and privacy model

The hosted site is static. Trial Balances and workspace records are processed and stored in the current browser's IndexedDB database; they are not sent to an application server. Each browser/profile has a separate workspace. Created companies survive ordinary page reloads, browser restarts, and White Horse application deployments on that same site origin and profile. They are not cloud-synchronised and can still be lost if site data is cleared, a private session ends, storage is evicted/corrupted, or a different browser/profile/device is used. Company Setup reports the browser's persistence mode and can request persistent storage where supported; encrypted backups remain mandatory for recovery. GitHub Pages still serves the public application files and may process ordinary request metadata under GitHub's policies.

The light/dark choice is stored separately in this browser's localStorage, so it survives reloads and sign-out and does not modify financial records. It remains after a workspace factory reset; clearing this site's browser data also clears the preference.

Browser storage is not a substitute for endpoint encryption or access control. Use the synthetic sample for public demonstrations. If real data is ever used in a controlled environment, protect the device and browser profile, create encrypted backups, and clear site data when the engagement ends.

**Reset all data** irreversibly removes every company, Trial Balance, mapping, adjustment, note, validation, local role, signature setting, and audit event stored by White Horse in the current browser origin. The operation asks once for confirmation, completes as one IndexedDB transaction, restores only the synthetic factory workspace, and signs the user out. Export and verify an encrypted backup first if recovery may be required.

This is not yet a hosted multi-user SaaS service. Before commercial production use, add independently tested authentication/authorisation, server-side tenant isolation and backup, monitoring, support operations, a privacy/compliance programme, and professionally validated taxonomy/rule packs for every framework and sector offered. Division II, Division III, consolidated, banking, insurance, and other regulated-sector reporting are not included in this release.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for the exact boundary.

## Run locally

Prerequisites: Node.js 24 and npm 11 or compatible current releases.

```powershell
npm ci
npm run dev
```

Vite displays the local URL. Because the production target is a project Pages site, the application base path is `/white-horse/`.

Quality gate:

```powershell
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

Preview the exact production bundle:

```powershell
npm run preview
```

## Study demo flow

1. Enter `admin` / `admin123` on the White Horse study-access cover. The access marker lasts only for the current browser tab session.
2. Open **Company setup** to show the legal identity, period, framework, local roles, and the new-company workflow.
3. Open **Trial Balance → Import Trial Balance** and upload a ledger-level `.xlsx`, `.csv`, `.tsv`, or delimited `.txt` export. Review the detected worksheet/header and use the mapper when headings are ambiguous. The standard CSV/XLSX template remains available as a controlled fallback.
4. Download and import one of the three verified synthetic XLSX examples from the dialog, or preview [the synthetic CSV](samples/saffron-trial-balance.csv). Do not activate a sample unless you intend to create a new local import version.
5. Review mapping status and posted/submitted adjustments.
6. Open **Review & validation** to run deterministic controls and inspect evidence.
7. Open **Financial statements**, verify the Equity and Liabilities-first Balance Sheet, switch among statements, and select a line for ledger drill-down.
8. Open **Notes & accounting policies** to review the generated company-specific text, reconciled schedule, and the explicit workpaper requirement for information that a TB cannot prove.
9. Use **PDF & signatures** to configure optional Director/DIN and CA/membership text blocks for the reporting period. Select **Export PDF**, then choose **Save as PDF** in the browser print dialog, or select **Generate complete financials** for the 11-sheet working-paper pack.
10. Open **Finalisation** to demonstrate the unresolved-matter gate and encrypted backup. Use **Reset all data** only after a verified backup and only when every local workspace should be deleted.

## Documentation

- [Functional architecture](docs/FUNCTIONAL_ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Accounting and validation logic](docs/ACCOUNTING_AND_VALIDATION.md)
- [Report catalogue](docs/REPORT_CATALOG.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [User guide](docs/USER_GUIDE.md)
- [Trial Balance import specification](docs/TRIAL_BALANCE_IMPORT_FORMAT.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [Durable project log](PROJECT_LOG.md)

## Deployment

Pushes to `main` run the pinned GitHub Actions workflow in `.github/workflows/deploy.yml`. The workflow audits, type-checks, tests, builds, uploads only `dist`, and deploys it to GitHub Pages using least-privilege job permissions. Detailed setup and rollback instructions are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

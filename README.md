# White Horse

White Horse is a local-first, multi-company financial-statement preparation workspace for Indian companies. This release implements a Schedule III Division I workflow for standalone non-Ind AS commercial or industrial companies. The public site starts with synthetic demonstration data, and users can create independent company workspaces in their own browser.

**Live HTTPS demo:** https://anshum940.github.io/white-horse/

> **Important:** White Horse is a preparation and study aid, not a substitute for professional judgement, statutory audit, legal advice, or an up-to-date disclosure checklist. The supplied demo must not be used for statutory filing.

## What it demonstrates

- CSV/XLSX Trial Balance preview, validation, versioned activation, and source-row traceability
- A vendor-neutral, eight-column Standard TB template (`WH-TB-1.0`) in CSV and XLSX
- Independent company workspaces, reporting periods, materiality settings, display scales, and local role records
- 21-character CIN format controls, non-overlapping comparative periods, and current financial-year defaults
- Ledger-to-taxonomy mapping with current/non-current and cash-flow classifications
- Balanced adjustment journals with preparer/reviewer states and workpaper references
- Deterministic Balance Sheet, Profit and Loss, and indirect Cash Flow statements
- Thirty structured notes/disclosure workpapers and twelve transparent analytical ratios
- Comparative notes, review rules, finalisation gates, and hash-linked audit events
- One-click 11-sheet Excel pack, CSV extracts, print/PDF, plain backup, and PBKDF2/AES-GCM encrypted backup flows
- IndexedDB persistence and a service-worker application shell for offline use

## Standard Trial Balance format

Use these exact headers on row 1, in this order:

```text
Ledger Code, Ledger Name, Group, Subgroup, Closing Debit, Closing Credit, Previous Debit, Previous Credit
```

Amounts must be positive values in INR, not lakhs or crores. Put each balance on either the debit or credit side, never both. Closing debits must equal closing credits exactly. Do not include title rows, group totals, subtotals, formulas, macros, or merged cells. Download [the source-controlled CSV template](samples/white-horse-tb-template.csv) or read the complete [Trial Balance import specification](docs/TRIAL_BALANCE_IMPORT_FORMAT.md). The application provides both downloads from **Trial Balance → Standard TB template**; the XLSX keeps the blank import sheet separate from its instructions and worked example.

## Data and privacy model

The hosted site is static. Trial Balances and workspace records are processed and stored in the current browser's IndexedDB database; they are not sent to an application server. Each browser/profile has a separate workspace. Created companies survive ordinary page reloads, browser restarts, and White Horse application deployments on that same site origin and profile. They are not cloud-synchronised and can still be lost if site data is cleared, a private session ends, storage is evicted/corrupted, or a different browser/profile/device is used. Company Setup reports the browser's persistence mode and can request persistent storage where supported; encrypted backups remain mandatory for recovery. GitHub Pages still serves the public application files and may process ordinary request metadata under GitHub's policies.

Browser storage is not a substitute for endpoint encryption or access control. Use the synthetic sample for public demonstrations. If real data is ever used in a controlled environment, protect the device and browser profile, create encrypted backups, and clear site data when the engagement ends.

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

1. Open **Company setup** to show the legal identity, period, framework, local roles, and the new-company workflow.
2. Open **Trial Balance → Standard TB template** to download the vendor-neutral CSV/XLSX format, then copy in the ledger-level export from the accounting package.
3. Preview [the synthetic CSV](samples/saffron-trial-balance.csv). Do not activate it unless you intend to create a new local import version.
4. Review mapping status and posted/submitted adjustments.
5. Open **Review & validation** to run deterministic controls and inspect evidence.
6. Open **Financial statements**, switch among statements, and select a line for ledger drill-down.
7. Select **Generate complete financials** to download the 11-sheet working-paper pack.
8. Open **Finalisation** to demonstrate the unresolved-matter gate and encrypted backup.

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

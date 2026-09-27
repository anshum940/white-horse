# White Horse

White Horse is a local-first financial-statement preparation workspace for Indian companies. This first release implements a Schedule III Division I-oriented workflow for a standalone commercial or industrial company, using synthetic demonstration data.

**Live HTTPS demo:** https://anshum940.github.io/white-horse/

> **Important:** White Horse is a preparation and study aid, not a substitute for professional judgement, statutory audit, legal advice, or an up-to-date disclosure checklist. The supplied demo must not be used for statutory filing.

## What it demonstrates

- CSV/XLSX Trial Balance preview, validation, versioned activation, and source-row traceability
- Ledger-to-taxonomy mapping with current/non-current and cash-flow classifications
- Balanced adjustment journals with preparer/reviewer states and workpaper references
- Deterministic Balance Sheet, Profit and Loss, and indirect Cash Flow statements
- Comparative notes, ratios, review rules, finalisation gates, and hash-linked audit events
- Multi-sheet Excel, CSV, print/PDF, plain backup, and PBKDF2/AES-GCM encrypted backup flows
- IndexedDB persistence and a service-worker application shell for offline use

## Data and privacy model

The hosted site is static. Trial Balances and workspace records are processed and stored in the current browser's IndexedDB database; they are not sent to an application server. Each browser/profile has a separate workspace. GitHub Pages still serves the public application files and may process ordinary request metadata under GitHub's policies.

Browser storage is not a substitute for endpoint encryption or access control. Use the synthetic sample for public demonstrations. If real data is ever used in a controlled environment, protect the device and browser profile, create encrypted backups, and clear site data when the engagement ends.

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

1. Open **Overview** to show KPIs, close progress, and review warnings.
2. Open **Trial Balance** and preview [the synthetic CSV](samples/saffron-trial-balance.csv). Do not activate it unless you intend to create a new local import version.
3. Review mapping status and posted/submitted adjustments.
4. Open **Review & validation** to explain deterministic controls and evidence.
5. Open **Financial statements**, switch among statements, and select a line for ledger drill-down.
6. Export the workbook or CSV locally.
7. Open **Finalisation** to demonstrate the unresolved-matter gate and encrypted backup.

## Documentation

- [Functional architecture](docs/FUNCTIONAL_ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Accounting and validation logic](docs/ACCOUNTING_AND_VALIDATION.md)
- [Report catalogue](docs/REPORT_CATALOG.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [User guide](docs/USER_GUIDE.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [Durable project log](PROJECT_LOG.md)

## Deployment

Pushes to `main` run the pinned GitHub Actions workflow in `.github/workflows/deploy.yml`. The workflow audits, type-checks, tests, builds, uploads only `dist`, and deploys it to GitHub Pages using least-privilege job permissions. Detailed setup and rollback instructions are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

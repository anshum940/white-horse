# White Horse Functional Architecture

## 1. Document control

| Field | Value |
| --- | --- |
| Product | White Horse Financial Statements Preparation & Reporting Tool |
| Architecture version | 1.1 |
| Status | Approved baseline for implementation |
| Date | 2026-09-29 |
| Default reporting framework | Schedule III, Division I (non-Ind AS), configurable and extensible |
| Deployment model | Local-first browser PWA with optional static hosting on GitHub Pages |
| Data residency | Local browser only; no application data is sent to GitHub or another server |

## 2. Objective and boundaries

White Horse converts an imported Trial Balance into traceable, reviewable, presentation-ready financial statements for Indian companies. The application supports mapping, adjustments, validation, statements, notes, ratios, Board/Bank packs, approvals, backups, and audit history.

White Horse is a preparation and review tool, not a substitute for professional judgement, statutory audit, legal advice, or a current technical review of the Companies Act, Schedule III, applicable Accounting Standards/Ind AS, and sector-specific regulations. The product must identify its configured framework and preserve preparer/reviewer responsibility on every final report.

### Initial implementation scope

- Standalone commercial/industrial company.
- Schedule III Division I as the seeded presentation taxonomy.
- Current and comparative financial year.
- Indian rupees with configurable display rounding.
- Indirect-method cash-flow statement.
- Synthetic sample company and balances for demonstration.
- Extensible framework keys for Division II and Division III without claiming those taxonomies are complete in version 1.

### Explicitly excluded from the first production baseline

- Consolidation and elimination entries.
- XBRL filing/submission.
- Live ERP, bank, tax, MCA, or cloud integrations.
- Automated accounting-policy conclusions.
- Multi-device synchronization.

These exclusions prevent silent overstatement of compliance. The schema and engines are designed so they can be added as separately validated modules.

## 3. Architecture principles

1. **Local first:** all company and financial data remains in browser-origin storage unless the user explicitly exports a file.
2. **No silent mutation:** imported TB, mapped TB, adjusted TB, and reported results are separate, immutable stages or versioned projections.
3. **Double entry:** every posted adjustment must balance before it can affect statements.
4. **Traceability:** every statement amount drills down to mapped ledger lines and approved adjustment lines.
5. **Review segregation:** preparer and reviewer actions are distinct; approval cannot be inferred from data completeness.
6. **Deterministic calculation:** given the same dataset, mapping version, approved adjustments, taxonomy version, and rounding policy, outputs are identical.
7. **Minor-unit arithmetic:** accounting amounts are stored as integer paise; floating-point arithmetic is not used for ledger aggregation.
8. **Defence in depth:** explicit public-demo access boundary, least-privilege workflow roles, safe file parsing, tamper-evident audit events, explicit backups, content security controls, and no production secrets in the client bundle.
9. **Progressive enhancement:** the installed PWA works offline after its application shell is cached; unsupported browser capabilities produce clear blocking diagnostics.
10. **Framework versioning:** Schedule III presentation taxonomies, validation rules, mapping masters, and accounting policies carry explicit versions and effective dates.

## 4. System context

```text
                 Optional first load / application updates
  GitHub Pages  --------------------------------------------> Browser
      (static HTML/CSS/JS only; no financial data)              |
                                                                 |
                         Local-only data operations              v
                 +-----------------------------------------------+
                 | Service worker / application shell            |
                 | React + TypeScript UI                          |
                 | Domain and validation engines                  |
                 | IndexedDB via Dexie                            |
                 | Web Crypto for password and backup controls    |
                 +-----------------------------------------------+
                      ^          ^             |
                      |          |             v
                  Excel/CSV   Manual input   PDF/print, Excel,
                    import                    CSV, JSON backup
```

GitHub Pages hosts only versioned application assets. IndexedDB is scoped to the Pages origin and is not included in Git commits or deployments. A different browser/profile/device has an independent database.

## 5. Application layers

| Layer | Responsibility | Constraints |
| --- | --- | --- |
| Presentation | Workflow navigation, forms, grids, drill-downs, reports, print layouts, accessibility | No accounting formula is implemented only in a UI component |
| Application services | Use cases, permissions, transactions, commands, approvals, import/export orchestration | All writes emit an audit event in the same logical transaction |
| Domain | Money, debit/credit, period, mapping, adjustment, taxonomy, validation, ratios, statement calculations | Pure deterministic functions wherever possible |
| Persistence | IndexedDB/Dexie repositories, schema migration, backup/restore | No implicit destructive migration; pre-upgrade backup required for major changes |
| Platform | Web Crypto, service worker, File API, print, browser capability checks | Fail closed where a required security or persistence feature is unavailable |

## 6. End-to-end workflow and gates

```text
Company Setup
   -> Reporting Period
   -> TB Import / Manual Entry
   -> Import Validation
   -> Mapping
   -> Mapping Review / Lock
   -> Adjustments
   -> Adjustment Approval / Posting
   -> Full Validation
   -> Statements and Notes
   -> Ratios / Board / Bank Packs
   -> Pre-finalisation Review
   -> Finalisation and Export
```

### Workflow states

| State | Entry criteria | Permitted changes | Exit criteria |
| --- | --- | --- | --- |
| `DRAFT` | Company and period created | All preparer edits | TB import selected |
| `TB_IMPORTED` | Active import is balanced or exception documented | Import replacement; no statement finalisation | Import validation completed |
| `MAPPING_IN_PROGRESS` | Ledger lines loaded | Mapping edits and suggestions | 100% material mapping and reviewer sign-off |
| `ADJUSTMENT_IN_PROGRESS` | Mapping version selected | Draft adjustment creation | All intended adjustments reviewed |
| `REVIEW` | Mapping locked; adjustments approved/posted | Reviewer comments, permitted corrections through new versions | No unresolved blocking errors |
| `READY_FOR_REVIEW` | Automated gates passed | Review only; changes reopen preparation | Reviewer approval |
| `FINALISED` | Reviewer approval and final backup | Read-only; amendments require a new revision | Export/archive complete |
| `REOPENED` | Authorised reopening with reason | Versioned correction only | Re-finalisation with new audit trail |

No state transition deletes history. Replacing an import, mapping, or report creates a new version and marks the prior version superseded.

## 7. Functional modules and screens

### 7.1 Access and installation

- Current public release: branded study-access cover using the documented `admin` / `admin123` demonstration credential, a tab-scoped non-secret session marker, sign-out, and bounded client-side failed-attempt delay.
- Security boundary: the static cover is bypassable and provides no server-side identity or data isolation; a production release must replace it with an identity provider/server session and enforced tenant/object authorisation.
- Target production extension: first-run organisation setup, managed administrator enrolment, recovery, session expiry and auditable sign-in events.
- Browser capability and storage-persistence check.
- Install-PWA guidance and offline readiness indicator.
- Role matrix: Administrator, Preparer, Reviewer, Viewer.

### 7.2 Company workspace

- Company list and search.
- Company profile: legal name, CIN, PAN (optional), registered office, industry, reporting framework, currency, rounding, board/auditor metadata.
- Reporting periods and comparatives.
- Workspace status, pending actions, and last backup.

### 7.3 Trial Balance

- Adaptive import wizard for `.xlsx`, `.csv`, `.tsv`, and delimited `.txt`.
- Multi-worksheet and first-50-row header scanning with automatic instruction/example-sheet exclusion, one/two-tier headers, common aliases, separate debit/credit layouts, opening-plus-movement layouts, signed balances, and Dr/Cr indicators.
- Explicit worksheet/header override and semantic column mapper; ambiguous unsigned balances require a user-selected sign convention rather than a guess.
- Preferred vendor-neutral `WH-TB-1.0` CSV/XLSX template for repeatable onboarding.
- Manual paste grid and manual ledger entry.
- Import staging, validation results, duplicate handling, and reconciliation.
- Version comparison and import replacement with explicit reason.
- Ledger register with current/prior figures and source-row trace.

### 7.4 Mapping master

- Searchable ledger-to-head mapping grid.
- Suggested mapping with confidence and explanation; never auto-approved.
- Schedule III hierarchy browser.
- Current/non-current, cash-flow, note, related-party, and expected-balance attributes.
- Bulk mapping, exception comments, reviewer approval, version lock, and mapping-history comparison.

### 7.5 Adjustments and workpapers

- Journal header and balanced debit/credit lines.
- Types: depreciation, tax, deferred tax, accrual, prepayment, provision, interest, bad debt/ECL, inventory, prior-period, exceptional, regrouping, and other.
- Mandatory narration, date, preparer, reference, evidence note, reviewer, and status.
- Draft → submitted → approved/rejected → posted lifecycle.
- Reversal date/entry support.
- Impact preview by statement, note, ratio, and validation.

### 7.6 Review and controls

- Red/Amber/Green dashboard with rule ID, evidence, amount, affected ledger/head, suggested action, owner, and resolution status.
- Reconciliations: imported-to-mapped, mapped-to-adjusted, adjusted-to-statements, P&L-to-equity, note-to-face, cash-flow-to-cash.
- Materiality settings and documented overrides.
- Review comments, assignments, evidence links (local attachment metadata), and sign-offs.

### 7.7 Financial statements and notes

- Balance Sheet with Equity and Liabilities presented before Assets.
- Statement of Profit and Loss.
- Cash Flow Statement.
- Statement of Changes in Equity where configured/applicable.
- Notes to Accounts and Significant Accounting Policies, including factual automatic company/TB-derived text and explicit `NO_BALANCE` / `REQUIRES_WORKPAPER` boundaries.
- Comparative columns, note cross-references, rounding, prior-year regrouping marker, and drill-down.

### 7.8 Ratios and analytics

- Current ratio, debt-equity, debt service coverage, return on equity, inventory turnover, trade receivables turnover, trade payables turnover, net capital turnover, net profit ratio, return on capital employed, and return on investment.
- Revenue, EBITDA, EBIT, PAT, net worth, debt, working capital, interest coverage, and variance analytics.
- Formula definition, input drill-down, current/prior values, percentage change, explanation, and anomaly flags.

### 7.9 Board and bank packs

- Executive summary, KPI tiles, trend charts, variance commentary, liquidity/leverage views, covenant/user-defined metrics, financial statements, ratios, and supporting schedules.
- Explicit draft/final watermark and preparation date.
- Synthetic demo pack for the public deployment.

### 7.10 Finalisation and exports

- Pre-finalisation checklist.
- Reviewer approval and period lock.
- Snapshot hash and report-run identifier.
- Six-section A4 browser print/PDF pack, spreadsheet workbook, CSV schedules, and JSON backup.
- Optional period-level Director/DIN block at lower left and CA/membership block at lower right of each face statement, independently visible and explicitly unsigned.
- Export manifest listing versions, rounding, generated time, preparer/reviewer, unresolved non-blocking warnings, and hashes.

### 7.11 Administration

- Local users and roles.
- Taxonomy/rule/mapping templates.
- Backup, encrypted export, restore preview, integrity validation, and restore point.
- Audit trail search/export.
- Retention settings and application/database versions.
- Global factory reset: one explicit confirmation, atomic deletion of all application tables, restoration of only the synthetic seed, active-company reset and sign-out. A verified encrypted backup is required for recoverability.

## 8. Permission model

| Capability | Admin | Preparer | Reviewer | Viewer |
| --- | :---: | :---: | :---: | :---: |
| Manage local users/settings | Yes | No | No | No |
| Create company/period | Yes | Yes | No | No |
| Import TB and edit mappings | Yes | Yes | Comment | No |
| Prepare adjustments | Yes | Yes | Comment | No |
| Approve mappings/adjustments | Yes* | No | Yes | No |
| Resolve validations | Yes | Propose | Approve | No |
| Finalise/reopen period | Yes* | No | Yes | No |
| View and export | Yes | Yes | Yes | Yes |

`*` An administrator acting as reviewer is allowed only when the installation has no separate reviewer; the report discloses that segregation of duties was not available.

## 9. Security and privacy architecture

- No analytics, telemetry, advertising, third-party fonts, remote API calls, or CDN runtime dependencies.
- Dependencies are bundled at build time and pinned by lockfile.
- Local passphrases are never stored. Store a salted, iterated PBKDF2 verifier; compare derived values using constant-work application logic.
- Keep the active session key in memory; session metadata may be kept in `sessionStorage`, never long-term bearer credentials.
- Apply a restrictive Content Security Policy compatible with the compiled application.
- Parse imports in memory, enforce file-size/row limits, reject active content, and never execute spreadsheet formulas/macros.
- Escape all imported text in the UI and reports.
- Encrypted backup uses a passphrase-derived key and AES-GCM with a unique random salt and IV; the export header includes version and KDF parameters.
- Audit events form a SHA-256 hash chain. This is tamper-evident, not a substitute for external notarisation.
- Final report snapshots include content hashes.
- PWA updates are announced and activated only after the user accepts; never reload during unsaved work.
- Public deployment includes only synthetic data. Real company data must never be committed, bundled, or placed in GitHub Actions artifacts.

## 10. Reliability, backup, and recovery

- Atomic IndexedDB transactions for multi-table writes.
- Idempotency keys for import, adjustment posting, finalisation, and restore.
- Autosave drafts with explicit saved state and timestamp.
- Backup reminder after material changes and before finalisation.
- Restore is two-stage: validate/preview into a temporary database, then replace or merge only with explicit confirmation.
- Automated migration tests from every supported schema version.
- Finalisation creates an immutable local snapshot plus an exportable backup.
- Browser storage eviction risk is displayed; the app requests persistent storage when supported and never represents browser storage as the only acceptable archive.

## 11. Non-functional requirements

| Area | Target |
| --- | --- |
| Availability | Fully usable offline after initial load/install, excluding first-time asset download and GitHub update checks |
| Performance | Import and validate 50,000 TB rows within 10 seconds on a current business laptop; interactive filtering under 250 ms for normal datasets |
| Accuracy | Integer-paise aggregation; deterministic results; zero unexplained reconciliation difference at finalisation |
| Accessibility | Keyboard navigable, visible focus, semantic landmarks/tables, WCAG 2.2 AA-oriented contrast and labels |
| Browser support | Current and previous major Chrome/Edge/Firefox; current Safari with documented IndexedDB caveats |
| Auditability | Every material write records actor, time, before/after digest, reason/reference, entity, and version |
| Maintainability | Strict TypeScript, modular domain services, schema/rule versioning, unit/integration/E2E tests |
| Observability | Local diagnostics log with redaction; exportable support bundle contains no financial values unless explicitly included |
| Recovery | User-downloadable backup; restore preview; finalisation backup gate; documented recovery drill |

## 12. Deployment topology

### Stable demonstration and distribution

- Public GitHub repository: `white-horse` (final owner determined after fresh GitHub authentication).
- GitHub Actions runs type checks, linting, unit tests, production build, and dependency audit policy checks.
- GitHub Pages deploys only the `dist` artifact after quality gates pass.
- Expected URL: `https://<owner>.github.io/white-horse/`.
- HTTPS is automatic on the `github.io` domain.

### Local development

- `npm run dev` for the Vite development server.
- `npm run build` for the static production artifact.
- `npm run preview` only for local build verification, not as a production server.

### Optional tunnel

Cloudflare Quick Tunnel or ngrok may expose a local preview for a supervised test. It is not the primary deployment and must never be used with real financial data unless authentication and an explicit risk assessment are in place.

## 13. Architecture decisions

| ID | Decision | Rationale | Trade-off |
| --- | --- | --- | --- |
| ADR-001 | Static local-first PWA | Stable HTTPS hosting, offline use, no server/account dependency for end users | Data is device/browser-specific; no automatic collaboration |
| ADR-002 | IndexedDB through Dexie | Browser-native embedded database, transactions, indexes, migrations, offline operation | Browser storage has quota/eviction constraints; backups are mandatory |
| ADR-003 | React + TypeScript + Vite | Typed modular UI and official static-deploy path to GitHub Pages | Build tooling and dependency maintenance required |
| ADR-004 | Integer paise | Avoid floating-point accounting errors | Format/parse layer must handle decimals and very large values carefully |
| ADR-005 | Versioned projections | Preserves imported/mapped/adjusted/final lineage | More storage and explicit state management |
| ADR-006 | Seed Division I only | Honest, testable initial compliance scope | Division II/III users require later validated taxonomy packs |
| ADR-007 | Browser print for PDF initially | Native, offline, low-dependency, inspectable output | Pixel-identical PDF generation across browsers is not guaranteed |
| ADR-008 | GitHub Pages public repository | Free, stable HTTPS, transparent study/demo distribution | Source is public; no secrets/proprietary data may be included |

## 14. Authoritative references

- Companies Act, 2013, including sections 128–129 and Schedule III: https://www.mca.gov.in/Ministry/pdf/CompaniesAct2013.pdf
- MCA Schedule III amendment effective 1 April 2021: https://www.mca.gov.in/Ministry/pdf/ScheduleIIIAmendmentNotification_24032021.pdf
- ICAI Division I guidance listing: https://www.icai.org/post/18041
- Vite static/GitHub Pages deployment: https://vite.dev/guide/static-deploy.html
- GitHub Pages overview: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Pages HTTPS: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- Dexie/IndexedDB documentation: https://dexie.org/docs
- Dexie backup/export documentation: https://dexie.org/docs/ExportImport/dexie-export-import
- React TypeScript guidance: https://react.dev/learn/typescript

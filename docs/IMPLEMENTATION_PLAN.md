# White Horse Implementation and Verification Plan

## 1. Delivery strategy

Implementation proceeds through gated vertical slices. A module is not complete until domain tests, persistence tests, UI error handling, accessibility checks, documentation, and realistic sample-data verification pass.

## 2. Phase plan

### Phase 0 — Architecture and controls baseline

Deliverables:

- Functional architecture.
- Database schema.
- Accounting logic and validation catalogue.
- Report catalogue.
- Implementation/test/deployment plan.
- Durable project log.

Exit: documents are internally consistent and record regulatory scope/limitations.

### Phase 1 — Application foundation

Deliverables:

- React/TypeScript/Vite project with strict compiler settings.
- Responsive finance-professional shell and design tokens.
- Hash-based routing compatible with GitHub Pages.
- Dexie schema v1 and repository abstractions.
- Local first-run user/session/role controls.
- PWA manifest, service worker, offline fallback, update notification.
- Synthetic company seed and deterministic demo reset.

Tests: build, type check, foundational unit tests, database create/migrate, offline asset test.

### Phase 2 — Trial Balance and mapping

Deliverables:

- CSV/XLSX/manual import wizard with preview and column mapping.
- Integer-paise parser supporting Indian and international grouping conventions.
- Import staging, duplicate/sign/balance validations, immutable activation/versioning.
- Schedule III Division I seed taxonomy.
- Mapping workspace, suggestions, bulk actions, current/non-current and cash-flow attributes.
- Mapping version submit/approve/lock and prior-year change report.

Tests: malformed files, formula/macro rejection policy, 50k-row benchmark fixture, duplicate variants, sign formats, mapping version immutability.

### Phase 3 — Adjustments and review

Deliverables:

- Adjustment workpaper and balanced journal lines.
- Prepare/submit/review/post/reverse lifecycle.
- Adjusted TB and impact preview.
- Validation dashboard, comments, assignments, resolutions, approvals, RAG state.
- Audit hash chain.

Tests: debit/credit property tests, permission matrix, concurrency/duplicate command idempotency, self-approval controls, audit verification.

### Phase 4 — Statements and notes

Deliverables:

- Balance Sheet, Statement of Profit and Loss, indirect Cash Flow, and Changes in Equity framework.
- Note totals, narrative blocks, policies, cross-references, comparatives, rounding.
- Full drill-down and reconciliation reports.
- Ratio engine with transparent formula components.

Tests: golden expected statements from realistic Indian-company TB, sign inversions, profit bridge, cash-flow closure, note reconciliation, rounding invariants.

### Phase 5 — Packs, finalisation, and recovery

Deliverables:

- Dashboard, Board Pack, and Bank Pack.
- Print/PDF layouts, XLSX/CSV extracts.
- Backup/export, encrypted backup, restore preview, integrity validation.
- Finalisation gate, immutable snapshot, reopening/revision.
- Admin/audit screens and support bundle.

Tests: print QA, workbook structure, backup round-trip, corrupt/wrong-passphrase backup, finalisation negative cases, restore migration.

### Phase 6 — Security, quality, and public deployment

Deliverables:

- Dependency and license review.
- Content Security Policy and security headers feasible on GitHub Pages via document metadata.
- No-secret/static-artifact inspection.
- Cross-browser and offline tests.
- GitHub Actions CI and Pages deployment.
- Public synthetic demo and user guide.

Exit: tests pass, Actions deploy succeeds, HTTPS URL is verified from an external network, and no real financial information is present.

## 3. Test strategy

### Unit tests

- Money parsing/formatting, Indian digit grouping, scale rounding.
- Debit/credit and closing-balance equations.
- Mapping roll-up, expected-normal-balance display.
- Adjustment balancing and posting.
- Statement totals, P&L bridge, cash flow, ratios, validation rules.
- Hash/canonicalisation and backup encryption primitives.

### Property/invariant tests

- Sum of generated balanced journal lines remains zero signed amount.
- Reordering input lines does not change statement totals or dataset hash after canonical sorting.
- Mapping roll-up equals sum of leaf balances.
- Presentation rounding does not change raw reconciliations.
- Backup → restore → backup yields equivalent logical dataset.

### Integration tests

- IndexedDB transactional writes and rollback.
- Versioned import replacement.
- Mapping lock and approval.
- Adjustment posting/audit event.
- Finalisation gate and snapshot.
- Migration from each schema fixture.

### End-to-end tests

- First-run setup through final statements.
- Import realistic sample TB, map exceptions, post adjustment, resolve validation, export reports.
- Reload and offline operation.
- Backup, reset, restore, and verify.
- Role-based restrictions and session timeout.

### Visual/report QA

- Desktop widths 1280, 1440, and 1920; tablet 768; narrow browser 390.
- Print A4 portrait/landscape, page breaks, repeated headers, long company/ledger names, negative values, zero rows.
- WCAG-oriented keyboard, focus, label, contrast, and semantic table checks.

## 4. Realistic synthetic test company

Seed **Saffron Industries Private Limited** with FY 2025–26 and FY 2024–25 comparative data. Dataset includes:

- Equity, secured/unsecured borrowings, PPE, deferred tax, inventory, receivables/payables, cash/bank.
- Revenue, other income, material/employee/other expenses, depreciation, finance cost, current/deferred tax.
- At least one intentionally unmapped ledger, negative-normal-balance exception, suspense balance, missing comparative, and ratio variance.
- Draft and approved adjustments for depreciation, outstanding expense, prepaid insurance, tax, expected credit loss, and inventory.

The clean expected dataset has an exactly balanced TB, Balance Sheet, note totals, and cash-flow closing cash. Deliberate-error variants drive validation tests.

## 5. Production-readiness gates

- No unresolved critical/high dependency vulnerabilities with a reachable path.
- No secret, token, personal/company financial data, or local backup in Git history/build artifact.
- Lockfile committed and CI uses `npm ci`.
- GitHub Actions permissions limited to `contents: read`, `pages: write`, `id-token: write` only for deploy.
- Third-party actions pinned to full commit SHA.
- Branch protection recommended after initial bootstrap.
- Release/version changelog and schema migration notes.
- Backup restore drill completed for release candidate.
- Regulatory taxonomy/rule review date recorded.

## 6. Deployment plan

1. Complete and verify locally.
2. Run type check, tests, production build, and artifact inspection.
3. Start a fresh `gh auth login --web` browser/device flow and let the user authorize the intended personal account.
4. Verify authenticated login and set repository-local Git `user.name` and verified/noreply email as chosen by the user.
5. Create public repository `white-horse` without embedding credentials.
6. Push `main` and enable GitHub Pages with GitHub Actions.
7. Wait for CI/deploy completion and inspect logs.
8. Open the HTTPS Pages URL, verify core workflow and offline reload, and test from a separate network/device.
9. Record repository, commit, workflow run, deployment URL, test evidence, limitations, and rollback steps in `PROJECT_LOG.md`.

## 7. Rollback and incident procedure

- Application release rollback: redeploy the last known-good commit; database migrations remain backward-safe or provide an explicit compatibility block.
- Corrupt local data: stop writes, export diagnostic metadata, validate audit chain, restore latest verified backup into preview, then replace after user confirmation.
- Accidental sensitive Git commit: stop deployment, unpublish Pages, revoke exposed credentials, remove the data from current and historical Git according to GitHub guidance, notify affected parties, and document the incident.
- Compromised GitHub session: revoke CLI/session credentials and Actions secrets/tokens, inspect audit/security logs, and rotate affected credentials.

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser storage eviction/device loss | Financial data loss | Persistent-storage request, prominent backup status, finalisation backup gate, restore drills |
| Shared-device access | Confidentiality breach | Local login, auto-lock, no default real-data user, OS account controls, encrypted backups |
| Public static site misconception | User assumes data is cloud-synced | Persistent local-only indicator, onboarding explanation, explicit export/import workflow |
| Regulatory change | Outdated presentation/validation | Versioned taxonomies/rules, effective dates, source links, annual professional review |
| Incorrect automated mapping | Misstatement | Suggestions only; confidence/explanation; preparer and reviewer approval |
| Spreadsheet formula/macro risk | Injection or unsafe content | Read values only, reject/ignore macros, sanitise text, formula-injection protection in CSV/XLSX exports |
| GitHub Pages outage | App update/uninstalled access issue | Installed PWA remains usable with cached assets; downloadable release artifact/local build option |
| Public source exposes intellectual property | Commercial concern | User explicitly approved public repository; never include company data/secrets |

## 9. Definition of done

White Horse is ready for the requested study demonstration when:

- The public repository and Pages site exist.
- The site loads over HTTPS without console-breaking errors.
- Synthetic demo company opens and demonstrates all core workflow stages.
- Trial Balance import, mapping, adjustment, validation, statements, ratios, drill-down, and backup/export work locally.
- Refresh and offline reload preserve demo/user data in the same browser.
- A new browser can load seeded synthetic data but cannot see another browser's private records.
- Automated tests and deployment workflow pass.
- Architecture, commands, outputs, errors, fixes, limitations, and next steps are current in project documentation.

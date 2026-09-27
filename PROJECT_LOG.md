# White Horse Project Log

## Purpose

This file is the durable source of truth for the White Horse financial-statement preparation project. It records objectives, assumptions, discussions, commands, outputs, errors, decisions, fixes, results, risks, next steps, and authoritative references so another engineer or AI can continue without conversation history.

## Current status

- Date: 2026-09-27 (Asia/Calcutta)
- Phase: Implementation, QA, public repository publication, and GitHub Pages deployment complete.
- Application status: The production PWA is live. Strict type checking passes, all 16 automated tests pass, the current dependency audit reports zero known vulnerabilities, the service worker is generated, and desktop/mobile/cached-offline/live-site QA has passed.
- Public URL status: **Live and verified over enforced HTTPS:** `https://anshum940.github.io/white-horse/`.
- Source repository: **Public:** `https://github.com/anshum940/white-horse` (`main`).
- Deployment status: The initial application run `36305550565` (attempt 2) and the final documentation-triggered run `36305988448` both completed successfully. The currently deployed verified revision is `fcf780d5da0b8989ac4fa44d6357751940ed5c50`.
- Preferred hosting direction: GitHub Pages for a stable HTTPS demonstration URL. The application is implemented as a local-first static PWA and the source repository may be public.
- Repository visibility: Public, explicitly approved by the user on 2026-09-27.

## Objective received

Build an offline-first professional financial-statements preparation and reporting tool named **White Horse** for Indian companies. The detailed product brief requires Trial Balance import, mapping, adjustments, Schedule III-oriented statements and notes, validations, ratios, Board/Bank packs, local storage, audit trails, backup/restore, and export capabilities. Before coding, the brief requires complete functional architecture, schema, module list, accounting logic, validation rules, report formats, and implementation plan.

The user additionally requires a way to demonstrate the completed application through an HTTPS URL accessible from outside the local computer, potentially using ngrok or an equivalent.

## Requirements source

- User-supplied brief: `C:\Users\anshu\.codex\attachments\cc230600-e0dc-43a3-b608-cbac318d5148\Pasted text.txt`
- The brief is treated as the product requirements baseline.

## Discovery performed

### Commands executed

The following PowerShell discovery operations were run from `C:\Users\anshu\Documents\Personal\CA-project`:

```powershell
rg --files -g '!node_modules' -g '!dist' -g '!build'
Get-ChildItem -Force | Select-Object Mode,Length,LastWriteTime,Name
Get-Content -LiteralPath 'C:\Users\anshu\.codex\attachments\cc230600-e0dc-43a3-b608-cbac318d5148\Pasted text.txt' -Raw
Get-Command git,node,npm,npx,python,py,docker,ngrok,cloudflared -ErrorAction SilentlyContinue
```

### Outputs and observations

- No project files were present in the workspace.
- Available locally:
  - Git: `C:\Program Files\Git\cmd\git.exe`
  - Node.js: `C:\Users\anshu\nodejs\node.exe`
  - npm/npx: `C:\Users\anshu\nodejs\npm.ps1` and `npx.ps1`
  - Python: `C:\Users\anshu\AppData\Local\Python\bin\python.exe`
  - Docker CLI: `C:\Program Files\Docker\Docker\resources\bin\docker.exe`
- Not found on `PATH`: Python launcher (`py`), `ngrok`, and `cloudflared`.
- No installation was attempted. Per project instructions, Docker-based tooling is preferred over adding host software when practical.

### Version and readiness validation

Additional read-only checks were performed:

```powershell
git --version
node --version
npm --version
python --version
docker version --format 'Client={{.Client.Version}}; Server={{.Server.Version}}'
gh --version
gh auth status
git rev-parse --is-inside-work-tree
git config --get user.name
git config --get user.email
```

Results:

- Git `2.55.0.windows.2`
- Node.js `v24.16.0`
- npm `11.16.0`
- Python `3.14.5`
- Docker CLI `29.5.3`; Docker Engine was not reachable in the current restricted session.
- GitHub CLI `2.93.0`
- The workspace is not currently a Git repository.
- No Git `user.name` or `user.email` is configured for this workspace.
- GitHub CLI reported several previously saved accounts, but every saved token is invalid. No existing session will be reused.

Docker warning/error:

```text
WARNING: Error loading config file: open C:\Users\anshu\.docker\config.json: Access is denied.
permission denied while trying to connect to the docker API at npipe:////./pipe/docker_engine
```

Root cause: the current restricted process cannot read the user's Docker configuration or access the Docker Desktop named pipe. This does not indicate that Docker is absent; only the CLI path and client version were verified. If Docker becomes necessary, Docker Desktop status and permissions must be validated in the user session.

GitHub authentication finding:

- The user offered use of their personal GitHub account associated with the supplied email address.
- Authentication will not be inferred from the email address and no stale account will be selected.
- Immediately before the first authenticated GitHub operation, use a fresh GitHub CLI browser/device flow, let the user authorize the intended account, then verify `gh api user`, repository ownership, and repository-local Git identity.

## Remote-access analysis

### Important architecture distinction

The core product requirement is offline-first operation and local data storage. An optional tunnel does not change that architecture: the application and database remain on the local computer, while the tunnel publishes the local web port temporarily. The public URL only works while the computer, application, Internet connection, and tunnel process are all running.

### Options evaluated

1. **Cloudflare Quick Tunnel**
   - Automatically provides an HTTPS `*.trycloudflare.com` URL.
   - Requires no Cloudflare account or owned domain.
   - Best fit for a short, supervised classroom/study demonstration.
   - The hostname changes whenever the tunnel restarts.
   - Cloudflare documents it as testing/development only, with no uptime SLA, a 200 in-flight request limit, and no Server-Sent Events support.

2. **ngrok agent endpoint**
   - Provides an HTTPS public endpoint through an outbound tunnel.
   - Requires a free ngrok account and authtoken.
   - A free development/static domain can provide a reusable hostname, subject to the current free-plan limits.
   - Supports edge authentication controls; these should be used whenever the demo contains non-public information.

3. **Named Cloudflare Tunnel with a custom hostname**
   - Provides a stable HTTPS hostname and can be protected with Cloudflare Access.
   - Requires a Cloudflare account and a domain configured in Cloudflare DNS.
   - Better for a longer-lived deployment, not necessary for a one-off study demo.

4. **GitHub Pages hosting for a local-first PWA (preferred for a stable study URL)**
   - Provides a stable project URL such as `https://<github-user>.github.io/white-horse/` and HTTPS automatically on the `github.io` domain.
   - The application must be deployable as static HTML/CSS/JavaScript. Local-only records can be stored in the browser's embedded storage and made available offline through a service worker/PWA cache.
   - No local computer or tunnel needs to remain running after deployment.
   - Each browser has an independent local database. A reviewer opening the URL will not automatically see data stored in the owner's browser, so the published build should include clearly marked synthetic demo data and support encrypted or explicit export/import for user-created files.
   - GitHub Pages content is publicly reachable even when a paid plan permits the source repository to be private. No secrets or real financial data may be committed or embedded in the build.
   - With GitHub Free, Pages is supported from public repositories. Private-repository Pages requires an eligible paid plan.

### Preliminary recommendation

- For the White Horse product and a stable demonstration URL: design it as a local-first static PWA and deploy the compiled application through GitHub Actions to GitHub Pages.
- Keep Cloudflare Quick Tunnel as a fallback for short-lived testing of any feature that later requires a local server.
- If a stable tunnel to a server process becomes necessary: use an ngrok reserved development domain or a named Cloudflare Tunnel after the user chooses/authenticates the relevant account.
- Do not expose real client/company financial data. Use synthetic or anonymized demonstration data, require application login, bind the local server to loopback where compatible, and shut down the tunnel immediately after the demo.

## Errors and root-cause analysis

- Initial blocking condition (resolved): a tunnel could not be started because the workspace was empty and no local HTTP port existed. The application is now implemented and buildable.
- Initial GitHub Pages workflow failure (resolved): the first workflow attempt reached `Configure GitHub Pages` before the repository's Pages site had been enabled and received HTTP 404. The application build, audit, type check, and tests had already passed. Pages was enabled with `build_type=workflow`, only the failed jobs were rerun, and attempt 2 completed successfully.
- The generic web-retrieval environment could not open the newly deployed Pages site. Direct HTTPS requests from the host and an independent visible browser both returned/rendered the live site successfully, so this was treated as a retrieval-tool limitation rather than a site failure.
- The browser automation evaluation sandbox did not expose `navigator` or `performance`, so service-worker registration could not be inspected through that isolated expression API. This does not affect the result: the deployed app displayed its PWA-ready state, `sw.js` and the manifest returned HTTP 200, and a prior stopped-server reload verified the cached offline application shell and IndexedDB workspace.
- No unresolved runtime or deployment defect is known at the final gate.

## Decisions

- The user approved a public GitHub repository. GitHub Pages is therefore the primary stable HTTPS deployment path.
- The supplied product brief plus the repository/deployment confirmation are treated as authorisation to implement White Horse in this workspace.
- Initial validated reporting scope is Schedule III Division I for a standalone commercial/industrial company; other divisions are represented as extension points and will not be mislabelled as complete.
- A persistent GitHub Pages URL was selected instead of an ngrok/Cloudflare quick tunnel because this static local-first PWA does not require a continuously running local server, and the study link must remain usable when the developer computer is off.
- The verified GitHub owner is `anshum940`; commits use GitHub's no-reply address rather than the personal email supplied in chat.

## Next steps

1. Use the live URL for the study demonstration and keep all demonstrated records synthetic or anonymised.
2. Review `docs/USER_GUIDE.md` for the recommended demonstration flow and `docs/DEPLOYMENT.md` for operations and rollback.
3. For later source changes, work on a branch, run the local quality gate, review the diff, and merge to `main`; the Pages workflow will redeploy automatically.
4. Treat this as a study/prototype system until the security, access-control, backup, regulatory, and assurance gaps listed in `SECURITY.md` and the architecture documents are addressed for any production use.

## Architecture package completed before coding

The following baseline documents were created before application source code:

- `docs/FUNCTIONAL_ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/ACCOUNTING_AND_VALIDATION.md`
- `docs/REPORT_CATALOG.md`
- `docs/IMPLEMENTATION_PLAN.md`

They cover objectives, scope, layers, modules/screens, workflow gates, permissions, security, resilience, database stores and constraints, accounting equations, validation rule IDs, report formats, implementation phases, test strategy, deployment, rollback, and risks.

Official sources checked during this phase:

- MCA Companies Act, 2013, including sections 128–129 and Schedule III.
- MCA Schedule III amendment notification effective 1 April 2021.
- ICAI Division I Schedule III guidance listing/publication portal.
- Vite official GitHub Pages deployment guidance.
- React official TypeScript guidance.
- Dexie official IndexedDB, transaction, migration, and export/import documentation.

## Dependency compatibility discovery

Commands attempted:

```powershell
npm view <package> version
```

The first registry query inside the restricted sandbox stalled after returning an unusable PowerShell object representation for one package and was interrupted. Root cause: registry/network access in the restricted process was unreliable. The same read-only version queries were then run with approved network access and completed.

Verified current registry versions on 2026-09-27:

| Package | Version |
| --- | ---: |
| react | 19.3.0 |
| react-dom | 19.3.0 |
| vite | 8.3.1 |
| typescript | 7.0.2 |
| @vitejs/plugin-react | 6.1.1 |
| vitest | 5.0.2 |
| dexie | 4.4.6 |
| dexie-react-hooks | 4.4.0 |
| exceljs | 4.4.0 |
| vite-plugin-pwa | 1.3.0 |
| @testing-library/react | 16.3.3 |
| fake-indexeddb | 6.2.5 |

The existing Node.js `v24.16.0` is suitable for the selected current Vite toolchain. Dependencies will be pinned by `package-lock.json`; no global package installation is planned.

### Installation, audit finding, root cause, and fix

Commands executed with approved npm registry access:

```powershell
npm install
npm audit --json
npm view read-excel-file version
npm view write-excel-file version
npm install
```

Initial installation added 501 packages and reported two moderate vulnerabilities. `npm audit` traced both to the direct `exceljs@4.4.0` dependency through its stale `uuid@8.3.2` dependency (`GHSA-w5hq-g745-h8pq`, missing buffer bounds check in UUID v3/v5/v6 when a buffer is supplied). The latest ExcelJS release still constrains the vulnerable dependency and upstream issues remain open. For a production-first baseline, this was not accepted even though White Horse would not intentionally call the vulnerable UUID APIs.

Fix applied:

- Removed `exceljs@4.4.0`.
- Added browser-focused `read-excel-file@9.3.10` and `write-excel-file@4.1.1`.
- Reinstalled dependencies, removing 98 packages and adding 7.
- Final npm result: 411 packages audited, **0 vulnerabilities**.

No `npm audit fix --force` was used because it proposed an older/breaking ExcelJS version and would not constitute a controlled fix.

## First implementation and verification gate

Implemented foundation components:

- Strict React/TypeScript/Vite/PWA configuration targeting `/white-horse/` on GitHub Pages.
- Restrictive document Content Security Policy, offline manifest, and local SVG application icon.
- Integer-paise money parser/formatter with Indian grouping and safe-integer enforcement.
- Versioned Division I taxonomy seed.
- Realistic, balanced synthetic Trial Balance for Saffron Industries Private Limited with FY 2025–26 and FY 2024–25 comparatives.
- Posted and submitted adjustment journals.
- Deterministic Balance Sheet, Profit and Loss, indirect Cash Flow, and KPI engines.
- Validation engine for TB, mappings, journals, Balance Sheet, Cash Flow, and review state.
- IndexedDB/Dexie schema and demo seed with mappings, notes, users, validations, and tamper-evident audit-event support.
- PBKDF2 password verifier and canonical SHA-256 record hashing utilities.

Commands executed in parallel:

```powershell
npm run typecheck
npm test
```

First result:

- Type checking failed on three inconsistent local variable/property names in the statement result and on Vite/Vitest configuration typing.
- Seven tests failed: six cascaded from the same statement variable-name runtime error; one money-format test used incorrect paise fixtures for the expected lakh values.

Root cause:

- Implementation naming mismatch (`...Liabilities...` versus `...Liability...`) in the return object.
- `defineConfig` imported from Vite did not include the Vitest `test` property type.
- Test data represented ₹123.45 lakh and ₹1.25 lakh while expecting ₹1,234.50 lakh and ₹125 lakh.

Fixes:

- Explicitly mapped the local calculation variable names to the public result property names.
- Imported `defineConfig` from `vitest/config`.
- Corrected the test paise fixtures without altering production money logic.

Verification after fixes:

- `npm run typecheck`: passed with no errors.
- `npm test`: 4 test files passed; 12/12 tests passed.
- Verified expected demo outcomes include PAT ₹42.50 lakh, total assets ₹310.00 lakh, a zero-paise Balance Sheet difference, and a zero-paise cash-flow reconciliation difference.

## Application implementation and second verification gate

### Functional implementation completed

The first deployable PWA now includes:

- Executive overview with period status, workflow progress, KPI cards, RAG validation summary, and current-versus-comparative financial trend.
- Company and reporting-period profile.
- CSV/XLSX Trial Balance preview and controlled activation, including file-size/row limits, duplicate detection, exact-paise parsing, balance validation, content hashing, and retained superseded imports.
- Ledger-to-taxonomy mapping workspace with suggestions, status control, current/non-current classification, and cash-flow class.
- Balanced adjustment-journal workflow with preparer submission, reviewer approval/rejection, posting, workpaper references, and immutable audit events.
- Review centre combining persisted review observations with live deterministic validation rules.
- Balance Sheet, Profit and Loss, and indirect Cash Flow statements with comparative columns and source-ledger drill-down.
- Notes workspace, ratio analysis, report-pack catalogue, multi-sheet Excel export, print-ready financial statements, encrypted/plain local backup, restore, finalisation gates, and audit timeline.
- IndexedDB/Dexie local persistence, seeded synthetic demonstration data, hash-linked audit records, and generated service worker/offline application shell.

### Commands executed

```powershell
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate --cache .npm-cache
```

### Intermediate errors and fixes

1. The first second-gate run found TypeScript errors in the Excel export styles/types and possible undefined access in the import header-alias lookup.
   - Root cause: the browser Excel writer uses `textColor` rather than `color`; its cell value is represented by the exported `Value` union rather than `Cell['value']`; strict indexed access required a fallback for a lookup that is logically present.
   - Fix: used the package's `CellObject`/`Value` types, corrected the style property, and added an explicit empty-array fallback.
2. The initial production build succeeded but warned that the entry chunk was 601.52 kB minified because both Excel libraries were loaded at startup.
   - Fix: converted XLSX import and workbook export to dynamic imports. The entry chunk fell to 467.68 kB; Excel code is now downloaded only when the user imports or exports a workbook.
3. The first dynamic-import attempt selected the reader library's default export and failed strict compilation because that overload did not return the raw row matrix expected by the importer.
   - Root cause: `read-excel-file/browser` exposes the raw worksheet reader as the named `readSheet` export.
   - Fix: dynamically imported the named `readSheet` export. No production logic or test expectations were relaxed.
4. A restricted-sandbox `npm audit` call could not reach the npm advisory endpoint and could not write to the user's npm log directory.
   - Root cause: restricted network and user-profile cache permissions, not a dependency defect.
   - Fix: reran the read-only audit with approved registry access and a project-local cache.

### Final verified outputs

- `npm run typecheck`: passed with zero errors.
- `npm test`: 5 test files passed; 15/15 tests passed.
- `npm run build`: passed using Vite 8.3.1.
- Generated PWA assets: `dist/sw.js`, `dist/workbox-2fbc6a65.js`, manifest, application shell, and on-demand Excel chunks.
- Main JavaScript: 467.68 kB minified / 137.87 kB gzip.
- Precache: 10 entries / 638.53 KiB.
- Live `npm audit`: **0 vulnerabilities**.
- Next gate: interactive browser QA of navigation, persistence, responsive layout, import/export/backup controls, and service-worker behaviour.

## Interactive browser QA and corrective work

### Production preview commands

Production previews were started on loopback-only ports 4173, 4174, and 4175 while iterating:

```powershell
npm run preview -- --host 127.0.0.1 --port <port>
```

The previews were inspected in a real browser at `/white-horse/`. After verification, `netstat -ano` identified the three exact Node listener PIDs. `Get-Process` confirmed their executable path and start times matched the preview sessions, and those exact processes were stopped. A subsequent `netstat` check confirmed no preview listener remained.

An attempted `Get-NetTCPConnection -State Listen` query returned `Access denied` in the restricted session. This did not affect the app. The read-only `netstat -ano` fallback provided the required listener/PID evidence without privilege escalation.

### Visual and functional results

- Desktop overview rendered the intended professional close workspace with ₹480.00 lakh revenue, ₹86.50 lakh EBITDA, ₹42.50 lakh PAT, workflow progress, two review warnings, and no console warnings/errors.
- Balance Sheet rendered ₹310.00 lakh on both sides with FY 2024–25 comparatives.
- Cash Flow rendered ₹69.50 lakh operating, ₹(19.00) lakh investing, ₹(41.50) lakh financing, and a ₹9.00 lakh net cash increase reconciling ₹15.00 lakh opening to ₹24.00 lakh closing cash.
- Statement line drill-down traced PPE from ₹150.00 lakh imported TB through ₹(1.00) lakh posted adjustment to ₹149.00 lakh presented amount.
- Mobile viewport 390 × 844 rendered responsive statement controls, legible report paper, a hidden sidebar, and a working overlay navigation drawer.
- Workbook export and Trial Balance CSV export both produced visible local success confirmation.
- The bundled synthetic CSV preview produced 27 rows, ₹755.50 lakh debit, ₹755.50 lakh credit, zero difference, and expected taxonomy suggestions. The preview was cancelled before activation so the test workspace remained unchanged.
- With every preview server stopped, reloading the 4175 origin still rendered the complete Trial Balance and IndexedDB workspace from the service worker with no console warnings/errors. This verifies offline application-shell operation; `navigator.onLine` may still report online when the network interface is up even if the origin is unavailable.

### Issues found and corrected

1. **Statements-page export was inert.**
   - Evidence: the primary `Export workbook` control rendered but had no click handler.
   - Fix: wired the existing tested multi-sheet exporter into `StatementsPage`, passed KPI/validation inputs from `App`, added busy state, and surfaced success/errors through the common toast.
2. **Trial Balance CSV export was inert.**
   - Evidence: the `Export CSV` control rendered without a handler.
   - Fix: added a UTF-8 BOM CSV builder/downloader with deterministic ordering, quoted/escaped values, exact two-decimal rupee fields, separate comparative debit/credit columns, UI success/error handling, and an automated escaping/amount test.
3. **Overview sentence agreement.**
   - Fix: made the review-warning status grammatically correct for singular and plural counts.
4. **Browser automation pointer activation.**
   - The test browser's pointer click did not activate certain controls, initially resembling an app defect. Native keyboard activation opened the modal and switched statement tabs, proving semantic controls and React handlers were correct. This was a QA-tool interaction issue, not retained as an application defect.
5. **File chooser automation timeout.**
   - Clicking the hidden file input directly did not open the browser chooser and the test harness timed out. Following the browser's upload guidance, clicking the visible `.import-zone` first opened the chooser; the synthetic CSV then loaded and validated successfully.

### Post-correction quality gate

```text
TypeScript: passed
Vitest: 6 files, 16/16 tests passed
Vite/PWA build: passed
Main JavaScript: 469.19 kB minified / 138.19 kB gzip
PWA precache: 10 entries / 640.00 KiB
Browser console: no warnings or errors in online or cached-offline checks
```

## Deployment hardening and operator documentation

Official Vite, GitHub Pages, GitHub Actions, and GitHub CLI documentation was refreshed immediately before creating deployment files. The current major tags for official actions were resolved directly from the official Git repositories:

```powershell
git ls-remote https://github.com/actions/<action>.git refs/tags/<major>
```

Pinned action commits:

| Action | Major | Commit |
| --- | --- | --- |
| `actions/checkout` | v7 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | v7 | `820762786026740c76f36085b0efc47a31fe5020` |
| `actions/configure-pages` | v6 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| `actions/upload-pages-artifact` | v5 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| `actions/deploy-pages` | v5 | `368f82528645a54fb793d4d04e342629a3f51346` |

Created:

- `.github/workflows/deploy.yml`: separate verification/build and Pages deployment jobs; locked install, audit, typecheck, tests, build, artifact, least-privilege permissions, OIDC, environment URL, concurrency control, and timeouts.
- `.github/dependabot.yml`: monthly npm and GitHub Actions update checks.
- `README.md`: scope, disclaimer, privacy boundary, local run, quality gate, study flow, documentation, and deployment.
- `PRIVACY.md`: local processing, hosting metadata, storage limitations, exports, and public-demo policy.
- `SECURITY.md`: reporting route, implemented controls, production limitations, and data-handling restrictions.
- `docs/USER_GUIDE.md`: end-to-end operating workflow and troubleshooting.
- `docs/DEPLOYMENT.md`: identity policy, first deploy, validation, rollback, availability, and references.
- `samples/saffron-trial-balance.csv`: balanced, synthetic, 27-row demonstration file; `.gitignore` was narrowed to allow only this sample directory while continuing to ignore ordinary CSV/XLSX exports.

## GitHub authentication and repository preparation

### Hygiene and local repository initialization

Before authentication, the complete publishable inventory was listed with hidden files included. A targeted secret scan checked for AWS access keys, private-key headers, GitHub token formats, common secret/password assignments, and the supplied personal email address. No matches were found. `dist`, `node_modules`, and the project-local npm cache are ignored; `.npm-cache/` was added explicitly after `git status --ignored` showed that its directory itself was not yet excluded.

The workspace was initialized as a new local Git repository on `main`. This operation required no authentication and made no external change. `.gitattributes` now normalises text to LF across platforms, and `.node-version` records Node.js 24 for local tooling.

### Fresh device authentication

Immediately before the first authenticated operation, `gh auth status` reconfirmed that every saved account token was invalid. A fresh browser/device flow was started:

```powershell
gh auth login --hostname github.com --git-protocol https --web --clipboard
```

The user entered the one-time device code and authorised the intended personal account. Authentication completed successfully. Independent verification returned:

- Active GitHub login: `anshum940`
- Display name: `Anshum`
- Numeric GitHub user ID: `105625445`
- Git protocol: HTTPS
- Credential storage: Windows keyring
- Authorised scopes include repository and workflow access; the token value was not printed.

A read-only lookup confirmed `anshum940/white-horse` does not exist, so the intended public repository name is available and does not conflict with an existing repository. The expected Pages URL is now documented as `https://anshum940.github.io/white-horse/`.

### Repository-local Git identity and sandbox ownership finding

The verified repository-local identity is:

```text
user.name=Anshum
user.email=105625445+anshum940@users.noreply.github.com
```

The GitHub no-reply address prevents the supplied personal email from being published in commit metadata.

Initial repository-local config and staging attempts failed with `.git` write/ownership errors. Root cause: the sandbox created `.git` under its isolated Windows identity, while approved host-side commands run as the user's Windows identity. Host-side Git therefore reported `detected dubious ownership`; sandbox-side Git could read but not create `index.lock` because `.git` is an explicitly protected path.

No global `safe.directory` exception was added. The safe fix is an exact, per-command override for this workspace only:

```powershell
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project <operation>
```

Using that scoped override, the local name/no-reply email were written and project files were staged. The staged secret scan returned no matches. The first staged whitespace check found extra blank lines at EOF in 25 new source/document files; those lines were removed and the working-tree whitespace check passed. Build outputs, dependencies, npm cache, and ordinary generated CSV/XLSX files remain ignored.

## Public repository and GitHub Pages deployment

### Repository publication

The verified project was committed with repository-local identity and published to the user-approved public repository. The durable identifiers are:

```text
Repository: https://github.com/anshum940/white-horse
Default branch: main
Initial commit: 587c98a1b4e3a8b1a0eddbc00d2b99bdde19387e
Initial subject: feat: build White Horse financial reporting PWA
Author: Anshum <105625445+anshum940@users.noreply.github.com>
Pages URL: https://anshum940.github.io/white-horse/
```

The principal publication and verification operations were:

```powershell
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project commit -m "feat: build White Horse financial reporting PWA"
gh repo create white-horse --public --source . --remote origin --push
gh api --method POST repos/anshum940/white-horse/pages -f build_type=workflow
gh run rerun 36305550565 --repo anshum940/white-horse --failed
gh run view 36305550565 --repo anshum940/white-horse --json status,conclusion,url,headSha,attempt,jobs
gh api repos/anshum940/white-horse/pages
gh repo view anshum940/white-horse --json nameWithOwner,url,visibility,defaultBranchRef
```

Read-only final evidence confirmed:

- Repository visibility is `PUBLIC` and the default branch is `main`.
- Pages uses `build_type: workflow`, is public, has no custom domain, and has `https_enforced: true`.
- Workflow run `36305550565`, attempt 2, is `completed/success` against the initial commit.
- Every locked-install, dependency-audit, type-check, test, production-build, Pages configuration, artifact-upload, and deployment step passed.

### First workflow failure, root cause, and safe correction

The push triggered the first workflow immediately. The verification/build work passed, but `actions/configure-pages` received HTTP 404 because GitHub Pages had not yet been enabled for this newly created repository. This was an ordering race between repository push and one-time Pages activation, not a source-code or workflow-quality failure.

The repository's Pages site was then enabled through the official API with the GitHub Actions build type. Only the failed workflow work was rerun. Attempt 2 completed successfully: `Verify and build` took approximately 25 seconds and `Deploy to Pages` approximately 11 seconds. GitHub emitted one informational annotation that the `ubuntu-latest` runner label would begin moving to Ubuntu 26 on 2026-10-19; Node.js is pinned explicitly in the workflow, and no current action is required.

### Public HTTPS and live-browser verification

Direct host checks were made against the public origin after the successful deployment:

```powershell
curl.exe -sS -o NUL -w "%{http_code} %{content_type} %{size_download}" https://anshum940.github.io/white-horse/
curl.exe -sS -o NUL -w "%{http_code} %{content_type} %{size_download}" https://anshum940.github.io/white-horse/manifest.webmanifest
curl.exe -sS -o NUL -w "%{http_code} %{content_type} %{size_download}" https://anshum940.github.io/white-horse/sw.js
curl.exe -sS -o NUL -w "%{http_code} %{content_type} %{size_download}" https://anshum940.github.io/white-horse/white-horse.svg
```

Observed results:

```text
/                     200 text/html                    1162 bytes
/manifest.webmanifest 200 application/manifest+json     409 bytes
/sw.js                200 JavaScript                   1448 bytes
/white-horse.svg      200 image/svg+xml                 685 bytes
```

An independent visible browser then opened the exact public URL, not a localhost preview. The deployed application rendered the synthetic Saffron Industries overview with the expected KPI values and no console warnings/errors. Hash navigation to Notes and Financial Statements worked; the Balance Sheet rendered ₹310.00 lakh on both sides; the deployed workbook export completed locally and displayed its success confirmation; and the application displayed its offline-ready notification. This verifies the study URL and critical public-demo path without exposing a local port.

### Final solution

GitHub Pages is the finished hosting solution. It provides a stable public HTTPS address, requires no always-on laptop or tunnel process, and preserves the application's privacy model because financial workspaces remain in each visitor's browser storage. The public build contains synthetic demonstration data only. A visitor does not receive records stored in another browser, and clearing site storage can remove that visitor's local workspace, so exports/backups remain the portability mechanism.

### Final documentation deployment and handoff closure

The first documentation handoff commit was `fcf780d5da0b8989ac4fa44d6357751940ed5c50` with subject `docs: record verified Pages deployment`. It triggered workflow run `36305988448`; the full verification and deployment workflow completed successfully without intervention.

The first status-list command used the guessed display name `Deploy White Horse to GitHub Pages` and returned `could not find any workflows named ...`. Root cause: the workflow's actual `name:` is `Verify and deploy White Horse`. Repeating the read-only query with that exact name found the queued run. This lookup error did not change the repository, workflow, or deployment.

This closing log update changes only `PROJECT_LOG.md`. Its commit message will include `[skip ci]`, which GitHub officially documents as suppressing workflows triggered by `push` or `pull_request`. This prevents an infinite operational loop in which documenting a successful documentation-only deployment continuously creates another identical deployment to document. The application artifact from the immediately preceding successful full gate remains the deployed artifact.

## Authoritative references

- Cloudflare Quick Tunnels: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Cloudflare remotely managed tunnels: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/
- Cloudflare Tunnel terminology and outbound-only model: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/tunnel-useful-terms/
- ngrok Docker agent: https://ngrok.com/download/docker
- ngrok share-localhost and security controls: https://ngrok.com/use-cases/share-localhost
- ngrok example documenting reservation of a free static domain and Basic Auth: https://ngrok.com/docs/universal-gateway/examples/ollama
- ngrok current plan limits: https://ngrok.com/pricing
- GitHub Pages overview and plan/repository availability: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Creating a GitHub Pages site, public reachability, and GitHub Actions deployment: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub Pages HTTPS: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub authentication guidance: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github
- GitHub CLI browser/device authentication: https://cli.github.com/manual/gh_auth_login
- GitHub Actions skip instructions: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs
- Vite static-site deployment: https://vite.dev/guide/static-deploy.html

## Change history

- 2026-09-27: Created initial durable log; recorded the supplied brief, empty-workspace finding, tool inventory, official-source research, preliminary tunnel recommendation, risks, blockers, and next steps.
- 2026-09-27: Recorded the user's offer to use a personal GitHub account; verified local versions, GitHub CLI state, Git identity state, Docker access, GitHub Pages constraints, and changed the preferred stable-hosting direction to a local-first PWA on GitHub Pages.
- 2026-09-27: User approved a public repository. Completed the required architecture/specification package before coding and recorded Schedule III Division I as the honest initial framework scope.
- 2026-09-27: Verified current npm dependency versions. Recorded and recovered from restricted registry-access stalling; selected locally installed Node/npm with project-local pinned dependencies.
- 2026-09-27: Installed dependencies, rejected ExcelJS after audit identified a vulnerable stale UUID dependency, replaced it with browser-focused read/write Excel packages, and achieved a zero-vulnerability npm audit result.
- 2026-09-27: Implemented and tested the typed accounting/data foundation. Diagnosed and fixed the first compile/test failures; final gate passed type checking and all 12 tests.
- 2026-09-27: Completed the deployable PWA workflows and UI. Diagnosed strict Excel typing, dynamic-import export selection, bundle-size, and restricted-audit issues; final gate passed type checking, all 15 tests, production PWA build, and a live zero-vulnerability audit.
- 2026-09-27: Completed desktop, 390 × 844 mobile, CSV import preview, workbook/CSV export, statement drill-down, and stopped-server offline QA. Corrected two inert export controls, added the synthetic import file and a sixteenth test, and verified a clean browser console.
- 2026-09-27: Added SHA-pinned least-privilege GitHub Pages CI/CD, Dependabot, README, privacy/security boundaries, user and deployment guides, and recorded current official-source/action-tag verification. Ready for fresh GitHub device authentication.
- 2026-09-27: Completed fresh device authentication as `anshum940`, configured repository-local no-reply Git identity, passed final hygiene checks, committed the verified application, created and pushed the approved public repository, and enabled GitHub Pages with enforced HTTPS.
- 2026-09-27: Diagnosed the initial one-time Pages activation race, enabled workflow-based Pages publishing, reran only the failed work, and verified successful build/deployment run `36305550565` (attempt 2). Confirmed HTTP 200 for the app shell, manifest, service worker, and icon, then completed live public-browser navigation, statement, export, console, and PWA-ready checks.
- 2026-09-27: Pushed the deployment-evidence documentation commit and verified its complete follow-up workflow `36305988448` succeeded. Corrected a harmless workflow display-name lookup error and prepared this closing documentation-only commit with GitHub's documented `[skip ci]` marker to avoid an otherwise recursive redundant deployment.

## Product-hardening phase requested on 2026-09-27

### New objective and user feedback

The user reported that multiple functions/controls appear not to work and requested a sellable, company-independent product rather than a single-company demonstration. The requested outcomes are:

- Rename the synthetic preparer display name from `Aarav Mehta` to `Abhijit`.
- Ensure every visible function/control has real behaviour; remove or clearly disable anything that is not implemented.
- Support configurable companies and reporting periods rather than binding the application to Saffron Industries.
- Provide a separate, explicit Trial Balance import template and make its required format prominent in the application.
- Generate the complete supported financial-statement pack in one action: Balance Sheet, Statement of Profit and Loss, Cash Flow Statement, notes/accounting policies, ratios, validations, and supporting exports.
- Preserve Schedule III presentation and traceability while preparing the product for demonstration to multiple prospective companies.

### Scope clarification and compliance boundary

“Any company” cannot truthfully be represented by one universal Schedule III taxonomy. Division I applies to companies following Accounting Standards, Division II to companies following Ind AS, and Division III to NBFCs following Ind AS; sector-specific laws, consolidation, accounting policies, and current MCA/ICAI requirements add further differences. This phase will productise and fully exercise the existing **standalone Schedule III Division I commercial/industrial** workflow, add explicit framework/entity metadata and extension boundaries, and avoid claiming that unimplemented Division II, Division III, consolidated, banking, insurance, or regulated-sector requirements are complete. Those require separately validated taxonomy/rule packs and professional compliance review before sale.

### Initial discovery

Commands used:

```powershell
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project status --short --branch
rg --files -g '!node_modules' -g '!dist'
Get-Content package.json
rg -n "Aarav|Saffron|button|onClick|download|export|import|Schedule III|Division" src docs README.md PROJECT_LOG.md
```

Findings:

- The repository was clean and synchronized with `origin/main` before this phase.
- `OverviewPage` hard-codes `Good morning, Aarav` instead of reading the active local user.
- The seed dataset and sample filename are deliberately synthetic, but the company setup and workspace-loading path must be reviewed for true multi-company behaviour.
- The statements page contains an unlabeled `more` icon control with no handler; similar decorative controls must be found systematically.
- Existing CSV/XLSX import, mapping, adjustments, validations, statement calculations, notes, ratios, workbook export, backup/restore, finalisation, and audit foundations can be extended instead of rewritten.

### Implementation completed in the working tree

The working tree now contains the following product-hardening changes; final publication is pending the remaining verification gates:

- Replaced the rendered `Aarav Mehta`/`Aarav` identity with the browser-local preparer `Abhijit`, including an idempotent data-maintenance migration for existing browser databases.
- Added independent company/workspace creation, editing, switching, period configuration, materiality, display-scale, and local-user administration instead of a single hard-coded company path.
- Added a full 30-note Division I disclosure workbench and note schedules, while retaining an explicit requirement for preparer/reviewer completion of entity-specific narrative and regulatory disclosures.
- Added the complete analytical ratio schedule, transparent formulas and limitations, CSV export, and an honest `N/A` state where principal-repayment or other required inputs do not exist.
- Added the prescribed eight-column Trial Balance template in CSV and XLSX, an in-application format reference, source-controlled sample template, and detailed import specification at `docs/TRIAL_BALANCE_IMPORT_FORMAT.md`.
- Added a one-click Excel pack containing Cover, Balance Sheet, Profit and Loss, Cash Flow, Notes to Accounts, Ratios, Trial Balance, Mapping, Adjustments, Validation, and Audit Trail worksheets.
- Wired the global company switcher, search, notifications, user profile, Company Setup edit/create/user controls, TB filters/template actions, mapping lock, validation run, notes search/review controls, ratio export, report pack selectors/print controls, and complete financial-pack actions. The unused statements overflow control was removed.
- Added route-level lazy loading and source-level control-wiring regression coverage.

Initial post-implementation gates passed:

```text
npm run typecheck: passed
npm test: 10 files, 20/20 tests passed
npm run build: passed
Production entry chunk: 400.93 kB minified / 123.04 kB gzip
PWA precache: 23 entries / 685.41 KiB
```

### Browser QA findings and fixes in progress

The first preview origin (`127.0.0.1:4176`) served a previously cached application shell through its registered service worker. The symptom was that hash navigation worked but newly added modal/state controls did not respond. A fresh origin (`127.0.0.1:4177`) loaded the exact current production bundle; search, template modals, CSV/XLSX template downloads, and Debit/Credit TB filters then worked. This was a QA-origin cache issue, not the current source. Production verification will use a fresh deployed asset revision, and the user guide will document update/refresh behaviour.

The fresh-bundle one-click workbook test then exposed a real export defect:

```text
`format` "0.0000" was specified on a cell of type `String`.
The only supported `format` for a cell of type `String` is "@".
```

Root cause: unavailable ratio values such as DSCR were correctly represented as `N/A`, but the workbook builder applied a numeric cell format to both numbers and the `N/A` string. Fix: a typed `ratioCell` helper now emits numeric-formatted cells only for numbers and plain text cells for unavailable values. The production bundle will be rebuilt on another fresh origin and the complete workbook re-tested before commit or deployment.

After that fix, fresh-origin browser QA showed the full-pack success confirmation. Two generated workbooks were written to the browser download directory at 22,674 bytes each. Read-only spreadsheet inspection of the latest file confirmed all 11 expected worksheets, 30 disclosure notes, 12 ratio rows, the intentional text `N/A` only for DSCR, 27 TB rows, exact TB equality of INR 75,550,000 on each side, Balance Sheet equality of INR 31,000,000, and no spreadsheet error tokens. Every sheet and the separate XLSX TB template were rendered and visually reviewed; no clipped core financial values, broken layouts, or invalid cell types were found.

The company-creation workflow then exposed a selection race. The new Northstar Components test workspace was successfully inserted, but the application immediately returned to Saffron Industries. Root cause: `activeCompanyId` changed before the `useLiveQuery` company-list snapshot refreshed, so the stale-list fallback treated the just-created ID as invalid. Fix: the fallback now reads the selected workspace from IndexedDB and only selects a fallback when that read confirms the ID is genuinely absent. This change is awaiting a rebuilt fresh-origin retest.

### Completed browser and spreadsheet verification

The selection-race fix was rebuilt and tested on the fresh origin `127.0.0.1:4179`. The browser created and selected the synthetic `Northstar Components Private Limited` workspace, showing its own legal identity, zero balances, 30 blank disclosure workpapers, 20% initial workflow score, and blocking `TB-000` result. Complete-financials generation correctly refused to proceed until a Trial Balance is imported. The company switcher listed both independent workspaces and returned to Saffron Industries without changing Saffron's balances.

The browser QA also confirmed:

- Global search filters pages/ledgers/notes and navigates to Trial Balance.
- Notifications list the two current Saffron review warnings and open the review centre.
- The profile control displays `Abhijit`, `@abhijit`, and the PREPARER role.
- TB format modal shows all eight prescribed columns and downloads both CSV and XLSX templates.
- All/Debit/Credit TB filters return 27/16/11 rows respectively.
- Validation execution records a run and reports three current results.
- Notes show 30 items and search narrows the index to the requested disclosure.
- Ratio CSV export reports success and the downloaded file contains all 12 rows, with DSCR blank/`N/A` because principal repayment is not available.
- Mapping review locks all 27 active mappings and records an audit event.
- One-click financials completes after the ratio-cell correction.
- Final browser console error/warning log is empty.

Read-only spreadsheet verification used the bundled spreadsheet runtime and `@oai/artifact-tool`; no workbook was altered during inspection. The downloaded full workbook contained:

```text
Cover:             15 rows × 2 columns
Balance Sheet:     37 rows × 4 columns
Profit and Loss:   20 rows × 4 columns
Cash Flow:         17 rows × 4 columns
Notes to Accounts: 31 rows × 8 columns (header + 30 notes)
Ratios:            13 rows × 7 columns (header + 12 ratios)
Trial Balance:     28 rows × 6 columns (header + 27 ledgers)
Mapping:           28 rows × 6 columns
Adjustments:        4 rows × 8 columns
Validation:         4 rows × 7 columns
Audit Trail:        4 rows × 9 columns
```

Independent controls observed from the saved XLSX:

```text
Balance Sheet total assets:                  INR 31,000,000.00
Balance Sheet total equity and liabilities:  INR 31,000,000.00
Trial Balance total debits:                   INR 75,550,000.00
Trial Balance total credits:                  INR 75,550,000.00
Spreadsheet error-token scan:                 0 matches
Intentional unavailable ratios:               DSCR only
```

All 11 workbook worksheets and the prescribed XLSX TB template were rendered and visually reviewed. The TB template has the exact eight headers, two balanced `EXAMPLE-*` rows, typed numeric INR values, and a visible instruction to replace both examples.

### Final local quality and security gates

Commands and results:

```powershell
npm run typecheck
# passed

npm test
# 10 test files, 20/20 tests passed

npm run build
# passed; 181 modules; entry 400.99 kB / 123.07 kB gzip
# PWA precache: 23 entries / 685.47 KiB

npm audit --audit-level=moderate
# first restricted-sandbox request could not reach the npm audit endpoint
# approved network retry: found 0 vulnerabilities

git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project diff --check
# passed with no whitespace errors

rg <targeted secret patterns>
# no credential/private-key/personal-email matches
```

The first audit failure was an environment/network restriction and inability to write the normal host npm log directory, not a dependency result. The required outside-sandbox retry reached the official npm registry and returned zero vulnerabilities.

Temporary spreadsheet inspection scripts, rendered QA images, and their dependency junction were deleted after verification. Browser-downloaded QA exports remain in the user's normal Downloads directory because deleting user files was not part of the request.

### Documentation synchronisation

Updated `README.md`, `docs/USER_GUIDE.md`, `docs/REPORT_CATALOG.md`, and the new `docs/TRIAL_BALANCE_IMPORT_FORMAT.md` to cover multi-company operation, the exact TB schema, 30-note/12-ratio workbenches, 11-sheet one-click output, service-worker update behaviour, and the honest commercial-readiness boundary.

### Authoritative accounting-framework references refreshed

- MCA Schedule III amendment notification dated 24 March 2021: https://www.mca.gov.in/Ministry/pdf/ScheduleIIIAmendmentNotification_24032021.pdf
- ICAI Guidance Note on Division I (revised January 2022): https://publication.icai.org/publication/76
- ICAI Guidance Note on Division II: https://publication.icai.org/publication/77
- ICAI Guidance Note on Division III: https://publication.icai.org/publication/79
- ICAI Corporate Laws and Corporate Governance publications index: https://www.icai.org/post/icai-publications-corporate-laws-corporate-governance-committee

These sources support the explicit scope boundary: Division I, Division II, and Division III require different presentation/disclosure packs. Banking, insurance, regulated-sector, consolidated, and entity-specific requirements must not be represented as covered by the current Division I module.

### Pre-deployment result and remaining commercial work

The working tree is ready for commit and public Pages deployment. The supported current product boundary is multi-company, standalone Schedule III Division I, non-Ind AS, commercial/industrial preparation with professional review. Before selling it as a production SaaS or claiming support for every company, the next programme must add separately validated Division II/III and sector packs, server-side tenant isolation, real identity and role enforcement, central backups, observability, incident/support operations, privacy/legal review, licensing, automated migration/retention controls, and independent accounting/security acceptance testing.

Immediately before publication, repository-local Git identity was reverified as `Anshum <105625445+anshum940@users.noreply.github.com>` and the `origin` remote as `https://github.com/anshum940/white-horse.git`. `gh auth status` found the previously saved token invalid, so no push was attempted. A fresh GitHub CLI web/device flow was completed and independently verified against the GitHub API as active account `anshum940` (numeric ID `105625445`); token contents were not printed or stored in project documentation.

### Product-hardening commit and public deployment

The verified changes were committed and pushed:

```text
Commit:  ce085b85b6126e4fbfc655b28d38f2f6bd86e18a
Subject: feat: productize multi-company financial reporting
Author:  Anshum <105625445+anshum940@users.noreply.github.com>
Remote:  https://github.com/anshum940/white-horse.git
Branch:  main
```

Push output confirmed `1c3f350..ce085b8  main -> main`. GitHub Actions run `36340320430` (`https://github.com/anshum940/white-horse/actions/runs/36340320430`) completed successfully. Its `Verify and build` job passed locked dependency installation, dependency audit, type-check, all tests, production PWA build, Pages configuration and artifact upload in approximately 20 seconds. `Deploy to Pages` passed in approximately 7 seconds. The only annotation remains GitHub's informational future migration of `ubuntu-latest` to Ubuntu 26 beginning 19 October 2026.

Public-origin verification returned HTTP 200 with HSTS and `https_enforced: true`. The live HTML references the expected final asset revisions:

```text
/white-horse/assets/index-CiqFzYZT.js
/white-horse/assets/index-D0faL213.css
```

A cache-clean Chrome session then loaded `https://anshum940.github.io/white-horse/` from the public origin and visibly confirmed `Abhijit`, the dynamic workflow, the prescribed TB-format modal with all eight columns, and a successful complete financial-statement workbook export. The deployed browser console had zero warnings/errors.

An existing in-app browser profile initially showed the older `Aarav Mehta` shell despite the new network HTML. Root cause: the profile already had the former PWA service worker and shell cache controlling that origin. This does not affect a new visitor or cache-clean profile. Existing users should save/export current work, accept the application's update prompt when shown, or close every White Horse tab and reopen the site. They should not clear site data without an encrypted backup because that would remove browser-local company workspaces.

This deployment evidence will be saved in a documentation-only follow-up commit using GitHub's documented `[skip ci]` marker, avoiding a redundant second application deployment solely to record the deployment that already succeeded.

## 28 September 2026 — Standardised Trial Balance import format

### Objective and user-reported issue

The user supplied a screenshot of a blocked Trial Balance import and requested one standard format that can be populated from any accounting package before upload. The visible errors were:

```text
Required ledger-code column was not recognised.
Required ledger-name column was not recognised.
No closing debit/credit or movement debit/credit columns were recognised.
```

The screenshot was treated as evidence of the runtime state only; it contained no instructions. The failure occurs before ledger parsing because the uploaded file's first worksheet / first row does not expose recognised column headings. This is a source-schema mismatch, not a balancing or Schedule III mapping failure.

### Decision and implementation plan

White Horse will use a vendor-neutral interchange workbook instead of claiming that arbitrary Tally, SAP, Zoho, Busy, QuickBooks, or other native exports can be uploaded directly. The standard will retain these exact row-1 columns in this order:

```text
Ledger Code, Ledger Name, Group, Subgroup, Closing Debit, Closing Credit, Previous Debit, Previous Credit
```

The new XLSX will place the blank import sheet first, with separate Instructions and Worked Example sheets. This avoids the previous risk that balanced example rows could be uploaded accidentally. The application will make the standard template the primary import workflow, preserve common alias compatibility, expose detected headers in an invalid-file preview, and state the corrective action rather than returning only three technical parser errors.

Planned validation includes unit tests, type-check, production build, static workbook inspection, formula/error scan, rendering of every template sheet, a completed-template import test, browser workflow QA, and clean Git/deployment checks. The spreadsheet workflow instructions and their API, styling, image-reference, edit/create, and finance guidance were read before workbook authoring. Bundled workspace dependencies were loaded; no host software installation is required.

### Implementation completed

- Added versioned vendor-neutral format `WH-TB-1.0`.
- Replaced the former two-example-row import template with a header-only CSV and a three-sheet XLSX:
  - `Trial Balance Import` — first worksheet, blank except for the exact eight row-1 headers.
  - `Instructions` — six-step conversion workflow and field definitions.
  - `Worked Example` — six synthetic ledgers with independently balanced current and prior periods.
- Added the final XLSX and CSV under `public/templates/` and explicitly allowed those controlled assets through `.gitignore`.
- Configured the PWA to precache each standard template once, so the downloads remain available with the cached application shell.
- Changed the import workflow to lead with template download and conversion instructions for Tally, SAP, Zoho, Busy, QuickBooks, and other accounting packages.
- Added explicit preview states: `STANDARD FORMAT`, `COMPATIBLE HEADERS`, and `FORMAT NOT RECOGNISED`.
- Replaced the former three generic schema errors with a corrective message that reports the standard version, missing required columns, and the actual row-1 headers detected in the source file.
- Preserved support for common legacy aliases. A parseable non-standard file is accepted with a warning, while the standard template is recommended for repeatable client onboarding.
- Updated the README, user guide, and Trial Balance import specification with a source-export-to-standard conversion matrix and removal rules for title rows, totals, subtotals, group headings, and narration-only rows.

### Spreadsheet construction and verification

The XLSX was authored with the bundled `@oai/artifact-tool` workflow and saved as:

```text
outputs/standard-tb-import/White_Horse_Standard_TB_Import.xlsx
```

Saved-workbook inspection confirmed the exact sheet order and import headers. The worked example reconciles as follows:

```text
Current closing debit:   INR 450,000.00
Current closing credit:  INR 450,000.00
Previous closing debit:  INR 360,000.00
Previous closing credit: INR 360,000.00
Spreadsheet error scan:  0 matches
```

All three sheets were rendered from the saved XLSX and visually reviewed. One tight instruction row was increased from 34 to 48 points and then re-rendered. The final workbook, committed public asset, and production-build asset have the same SHA-256 hash:

```text
7541E4F3237D11C0219D31FAFB0C7C15399789BDF2149CFADBCDCB97BE81372F
```

### Automated and browser validation

Commands and results:

```powershell
npm run typecheck
# passed

npm test
# 10 test files, 22/22 tests passed

npm run build
# passed; 181 modules; entry 400.99 kB / 123.07 kB gzip
# PWA precache: 25 entries / 687.64 KiB

npm audit --audit-level=moderate
# first restricted run could not reach the npm audit endpoint and could not write its normal host log
# approved network retry: found 0 vulnerabilities
```

The static XLSX asset returned HTTP 200 from the production preview with the expected 17,239-byte body. The final service worker contains one CSV and one XLSX template precache entry; an intermediate build exposed duplicate entries because both `includeAssets` and `globPatterns` selected them, so XLSX/CSV were removed from `globPatterns` and the build was repeated.

Browser QA against the production bundle confirmed:

- The Trial Balance page presents **Standard TB template** and the `WH-TB-1.0` guide.
- The XLSX download control fetched the template and displayed a success notification.
- A synthetic native export with `Account Description`, `Debit Amount`, and `Credit Amount` produced `FORMAT NOT RECOGNISED`, named all three detected headers, and directed the user to the standard template.
- A completed standard CSV and a completed copy of the generated XLSX both produced `STANDARD FORMAT`, six parsed rows, equal debit/credit totals, zero difference, and no browser console warnings/errors.
- Activation was intentionally not confirmed, so the existing demonstration Trial Balance was not changed.

One first browser file-chooser attempt targeted the hidden file input and timed out. Root cause: the in-app browser exposes its chooser only when the visible upload surface is clicked. The browser session was re-established, the documented visible-surface chooser flow was used, and both CSV and XLSX verification then passed.

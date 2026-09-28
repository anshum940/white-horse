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

### Commit and public deployment

Repository-local Git identity and remote were reverified before commit:

```text
Anshum <105625445+anshum940@users.noreply.github.com>
https://github.com/anshum940/white-horse.git
```

Because GitHub authentication is account-sensitive, a fresh GitHub CLI web/device authorization was completed. The authenticated account was independently verified through the GitHub API as `anshum940`, numeric ID `105625445`, before any push. Token contents were not printed or stored in project files.

The verified implementation was committed and pushed:

```text
Commit:  1609828cad1f44c52e413643dbafdea7928fd294
Subject: feat: standardize trial balance imports
Branch:  main
Push:    c675d66..1609828 main -> main
```

GitHub Actions run `36344317877` (`https://github.com/anshum940/white-horse/actions/runs/36344317877`) completed successfully. The `Verify and build` job passed dependency installation, audit, type-check, all tests, production build, Pages configuration, and artifact upload in 30 seconds. `Deploy to Pages` completed in 11 seconds. The only annotation is GitHub's informational future migration of `ubuntu-latest` to Ubuntu 26 beginning 19 October 2026.

Post-deployment checks returned HTTP 200 from `https://anshum940.github.io/white-horse/`. The live Standard TB XLSX at `https://anshum940.github.io/white-horse/templates/White_Horse_Standard_TB_Import.xlsx` was downloaded independently and matched the verified local artifact exactly:

```text
Live length: 17,239 bytes
Live SHA-256: 7541E4F3237D11C0219D31FAFB0C7C15399789BDF2149CFADBCDCB97BE81372F
```

This deployment evidence will be saved in a documentation-only follow-up commit with `[skip ci]`, avoiding an unnecessary second application deployment.

## 28 September 2026 — Company-master validation and browser-data durability audit

### Objective and user report

The user identified that the Company Setup form accepts an invalid Corporate Identity Number (CIN) and requested a systematic bug audit followed by one-by-one fixes. The first explicit requirement is that CIN accept only the prescribed 21-character alphanumeric identifier. The user also asked whether newly created companies and subsequent work remain available or can be lost.

### Initial evidence and risk statement

Code inspection confirmed that the repository layer currently checks only whether CIN is non-empty and unique in the current browser. The Company Setup input has no `maxLength`, character restriction, inline validation, or CIN-format check. Date-range validation checks each range internally but does not prevent the comparative period from overlapping or following the current period. The form also waits until save to surface most errors as a transient notification, which makes correction unnecessarily difficult.

The database is IndexedDB (`white-horse-production`) accessed through Dexie. It is durable across ordinary reloads, tab/browser restarts, and application-code deployments on the same origin and browser profile. It is not account-based cloud storage and does not synchronise between devices or browser profiles. Browser/site-data deletion, private-session closure, storage eviction while the origin remains best-effort, corruption, or an incompatible migration can remove browser-local data. Encrypted backup/restore exists under Finalisation and remains the required recovery control.

### Authoritative research

- MCA form instruction kits require a valid/approved CIN and use it as the authoritative company identifier; the implementation will apply the standard 21-character CIN shape locally and clearly state that syntactic validation is not an MCA master-data verification: https://www.mca.gov.in/content/dam/mca/mca-forms-instruction-kit/Instruction%20Kit_Form%20No%20DIR%203C.pdf
- MDN documents IndexedDB as persistent client-side browser storage, while explicitly noting that users can clear it, private browsing removes it at session end, quota/corruption can affect it, and synchronisation requires a separate server-side design: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology
- Browser storage is best-effort by default. `navigator.storage.persist()` can request persistent mode, but the browser may deny the request and explicit user deletion still removes the data: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria and https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist

### Planned corrective work

1. Centralise and test company-master validation in the domain layer so UI and database writes cannot diverge.
2. Enforce and explain the 21-character CIN structure, normalise lowercase input, reject non-alphanumeric characters, and retain duplicate-CIN protection.
3. Add inline errors and prevent submission while the form is invalid.
4. Tighten reporting/comparative period chronology and materiality validation.
5. Expose browser-storage durability state and allow a user-initiated persistent-storage request on supported HTTPS browsers, while preserving the encrypted-backup warning.
6. Exercise creation, validation, reload persistence, and editing through automated tests and the production browser bundle before deployment.

### Commands and observations to date

```powershell
git status --short --branch
# main...origin/main; no working-tree changes before this audit

rg -n --hidden --glob '!node_modules/**' "\\b(cin|CIN|Company|company|IndexedDB|Dexie|persist|backup|materiality|periodStart|periodEnd)\\b" src PROJECT_LOG.md README.md docs package.json
# Located Company Setup, database validation, backup/restore, IndexedDB documentation, and existing persistence disclosures.

Get-Content -Raw src\pages\CompanyPage.tsx
Get-Content src\db.ts | Select-Object -First 390
# Confirmed the missing CIN/UI validation and existing browser-local persistence architecture.
```

### First corrective batch implemented

The code now has one domain-level validation policy used by both the React form and the IndexedDB repository. This prevents direct/service-layer calls from bypassing browser controls.

Resolved defects:

1. **CIN accepted arbitrary text** — the UI now uppercases input, removes characters outside `A–Z` and `0–9`, caps the field at 21 characters, displays the live count, and checks the established `L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits` structure. The repository repeats the validation before every create/update. This is a format check, not a live MCA master-data verification.
2. **New-company dates were hard-coded to FY 2025–26** — defaults are now derived from the current Indian financial year, including January–March rollover and the preceding comparative year.
3. **Impossible calendar dates were accepted by service calls** — ISO calendar dates are now validated by components, so values such as 30 February are rejected.
4. **Comparative/current periods could overlap** — each range must be internally ordered and the comparative end must precede the current start.
5. **Identical current/comparative labels were accepted** — case-insensitive duplicate labels are blocked.
6. **Invalid materiality and unbounded master text** — positive safe-integer paise validation remains enforced, decimal-conversion errors are displayed inline, supported presentation scales are checked at runtime, and reasonable legal-name/trade-name/address/industry/label limits are enforced.
7. **Only transient save errors were shown** — required markers, inline field errors, an error count, accessibility state, and a disabled save action now make the correction path visible before a write.
8. **Persistence risk was implicit** — Company Setup now reports `PERSISTENT`, `BEST EFFORT`, `NOT SUPPORTED`, or `UNAVAILABLE`, offers a user-initiated persistent-storage request where supported, explains that this remains same-browser storage, and links directly to backup/restore.

### Automated checks and encountered errors

```powershell
npm run typecheck
# passed

npm test
# initial post-change run: 12 test files, 31/31 passed

npm test -- --runInBand
# failed before tests: Vitest 5 does not support the Jest-specific --runInBand option
```

Root cause: `--runInBand` is a Jest CLI option and is not recognised by the installed Vitest 5 CLI. No source-code failure occurred. The unsupported argument was removed.

The first database-integration run then reported three `DatabaseClosedError` failures. Root cause: the test deleted the singleton Dexie database and immediately called application initialisation without explicitly reopening that same closed instance. The fixture now performs `await db.open()` after deletion, accurately restoring the lifecycle used by the application.

```powershell
npm test
# after fixture correction: 13 test files, 34/34 tests passed
```

The new database tests verify that an invalid CIN writes no records, a valid company creates its independent 30-note workspace, a duplicate CIN is blocked, and the company remains readable after the IndexedDB connection is closed and reopened.

### Additional audit corrections

Two further defects were found during the screen-flow audit and corrected:

9. **Misleading encryption wording** — the loading screen said it was opening an “encrypted-browser data layer”, while the documented architecture correctly states that IndexedDB is not encrypted by White Horse at rest. The copy now says “browser-local data layer”. Encrypted `.whbackup` exports remain encrypted; IndexedDB itself is not represented as encrypted.
10. **Enter key did not submit Company Setup** — the modal used click handlers without a semantic HTML form. Company Setup now uses a real form and linked submit button, so Enter submits a valid form while invalid state remains blocked. This also improves keyboard and assistive-technology semantics.

### Production-bundle browser verification

The first production bundle was served on the fresh local origin `127.0.0.1:4181`. Browser QA confirmed:

- Company Setup reported `BEST EFFORT` storage and displayed **Protect browser storage** plus **Open backup & restore**.
- New-company defaults were FY 2026–27 and comparative FY 2025–26 on 28 September 2026.
- Pasting `abc-123` into CIN produced `ABC123`, showed `CIN must contain exactly 21 characters (6/21)`, and kept creation disabled.
- Pasting a lowercase/hyphenated valid identifier produced `U62010DL2026PTC654321`, enabled creation, and created a separate synthetic `Validation Test Private Limited` workspace.
- A full page reload retained that company as the active workspace.
- The company switcher displayed both the new independent workspace and the untouched Saffron Industries demonstration.
- An identical current/comparative label showed the inline conflict and disabled saving.
- Browser console warnings/errors: zero.

An automated date-input fill changed Chromium's rendered date value without firing React's change event; the next text-field event restored the controlled date value. Root cause: the browser automation path did not emulate the segmented native date control's user event. This was a test-harness limitation, not an application write. Date chronology is covered by direct domain tests, and no invalid date was saved.

After the semantic form and corrected loading copy were added, the final bundle was rebuilt and served on the clean origin `127.0.0.1:4182`. A valid synthetic `Keyboard Test Private Limited` workspace was created by pressing Enter from the Industry field. A full reload retained it, and the final browser console again contained zero warnings/errors.

Final local gates at this stage:

```powershell
npm run typecheck
# passed

npm test
# 13 test files, 34/34 tests passed

npm run build
# passed; 183 modules; entry 403.08 kB / 123.90 kB gzip
# PWA precache: 25 entries / 695.50 KiB

npm audit --audit-level=moderate
# restricted attempt could not reach the official npm audit endpoint and could not write its host cache log
# approved network retry: found 0 vulnerabilities
```

Pre-commit repository checks confirmed the expected identity and remote:

```text
Git:  C:\Program Files\Git\cmd\git.exe
GH:   C:\Program Files\GitHub CLI\gh.exe
Node: C:\Users\anshu\nodejs\node.exe
npm:  C:\Users\anshu\nodejs\npm.ps1

Anshum <105625445+anshum940@users.noreply.github.com>
https://github.com/anshum940/white-horse.git
```

`git diff --check` passed. A targeted tracked/untracked source scan found no private-key blocks, GitHub personal-access-token patterns, or AWS access-key identifiers. The working tree contains only this corrective batch and its documentation/tests.

The first staging command was rejected by Git's dubious-ownership protection because the managed sandbox created `.git` under its service SID while the current Windows user has a different SID. No file was staged by that failed command. The safe fix was a command-scoped override—`git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project add ...`—rather than changing the user's global Git configuration. Staging then succeeded.

### Commit and public deployment

The tested correction batch was committed locally:

```text
Commit:  a9e00ea6925a484a68e309f7ce44d65d1d149541
Subject: fix: validate company setup and local persistence
Branch:  main
```

Before the push, a fresh GitHub device-code authorization was initiated and completed by the user. `gh auth status` showed `anshum940` as the active account, and the GitHub API independently returned login `anshum940`, numeric account ID `105625445`. Other saved accounts remained inactive. Token contents were masked and were not stored in project files.

```text
Push: 179696e..a9e00ea main -> main
Repository: https://github.com/anshum940/white-horse.git
```

GitHub Actions run `36346182003` completed successfully: https://github.com/anshum940/white-horse/actions/runs/36346182003

- **Verify and build** completed in 21 seconds: locked dependency installation, dependency audit, type-check, all tests, production PWA build, Pages configuration, and artifact upload passed.
- **Deploy to Pages** completed in 8 seconds.
- The only annotation is GitHub's informational future migration of `ubuntu-latest` to Ubuntu 26 beginning 19 October 2026.

The first restricted public-origin fetch was blocked by the workspace socket policy and consequently attempted to inspect a null response. The approved network retry succeeded with HTTP 200, HSTS `max-age=31556952`, and the exact final production assets:

```text
/white-horse/assets/index-tqsbjUX_.js
/white-horse/assets/index-593X4bZ1.css
```

The existing live in-app browser profile initially rendered the previous cached application shell, then correctly displayed **A verified update is available**. Selecting **Update** activated the deployed service worker without deleting or replacing the existing Saffron Industries IndexedDB workspace. Live UI inspection then confirmed:

```text
CIN maxlength:       21
CIN pattern:         [LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}
Current default:     FY 2026–27
Comparative default: FY 2025–26
Blank-form submit:   disabled
Console issues:      0
```

The public release is available at https://anshum940.github.io/white-horse/. This deployment record will be saved in a documentation-only `[skip ci]` follow-up commit to avoid running and redeploying the unchanged application a second time.

## 28 September 2026 — Adaptive Trial Balance import and signed PDF pack

### Objective and user requirement

The user requested three connected improvements:

1. Import Trial Balances from differing accounting-software layouts without leaving the user at a persistent “format not recognised” error.
2. Add a PDF export for the financial-statement pack.
3. Add optional, company-specific signing blocks with a Director at the lower left (including DIN) and a Chartered Accountant at the lower right (including membership number), with independent show/hide controls.

“Any format” is being implemented as a safe adaptive import for tabular `.xlsx`, `.csv`, `.tsv`, and delimited `.txt` files: worksheet and header-row discovery, broad but explicit field aliases, support for debit/credit pairs and signed-balance plus Dr/Cr-indicator layouts, generated ledger codes when the source has names but no codes, and an explicit column-mapping fallback where an export is ambiguous. White Horse will not silently guess an uncertain balance direction and will not claim to parse scanned PDFs, legacy binary `.xls`, password-protected workbooks, macro formats, corrupt files, or arbitrary proprietary binary formats.

### Skills and governing workflow

The spreadsheet workflow is being used for the multi-layout importer and the PDF workflow for a verified print/PDF financial pack. The spreadsheet instructions, existing-file workflow, API quick start, style rules, and financial-model guidance were read before implementation. The PDF instructions were read before work on export behaviour. This task changes application code rather than directly authoring a standalone workbook, so the spreadsheet artifact-operation marker is not applicable unless a workbook deliverable is subsequently created or edited through the artifact runtime.

### Initial code and repository inspection

The working tree began clean and synchronized:

```text
## main...origin/main
```

Relevant commands executed:

```powershell
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project status --short --branch
Get-ChildItem -Force
rg --files src
rg -n --hidden -S "trialBalance|Trial Balance|window\.print|PDF|pdf|signature|director|DIN|membership|Company|read-excel-file|xlsx|CSV|csv" src package.json PROJECT_LOG.md
Get-Content -Raw src\services\trialBalanceImport.ts
Get-Content -Raw src\pages\TrialBalancePage.tsx
Get-Content -Raw src\pages\StatementsPage.tsx
Get-Content -Raw src\pages\ReportsPage.tsx
Get-Content -Raw src\domain\types.ts
Get-Content -Raw src\db.ts
Get-Content -Raw src\services\backup.ts
Get-Content -Raw src\services\excelExport.ts
Get-Content -Raw src\services\trialBalanceImport.test.ts
Get-Content -Raw node_modules\read-excel-file\README.md
```

The first broad `rg` used the Unix-style glob operand `vite.config.*`, which PowerShell passed as a literal invalid Windows filename and reported `os error 123`. This did not affect the repository. Later queries use explicit filenames or `--glob` options.

### Confirmed root causes in the current importer

- XLSX processing calls `readSheet(file)`, which reads the first worksheet only.
- The parser hardcodes row 1 as the header.
- Ledger code and ledger name are both mandatory; a common name-only accounting export is rejected.
- Only a small set of exact normalized aliases is recognised.
- The parser handles separate closing debit/credit columns or opening plus debit/credit movements, but not a signed balance column, an adjacent Dr/Cr indicator, or values such as `1,000.00 Dr`.
- The UI has no worksheet/header/column mapping fallback. It therefore instructs users to copy into the White Horse template even when the source is otherwise usable.
- The old error is correctly cleared before a new file is parsed, but users cannot correct an ambiguous layout in the same import session.

The installed `read-excel-file` 9.3.10 documentation confirms that its default browser export returns every worksheet as `{ sheet, data }`; the named `readSheet` helper intentionally returns one worksheet. The adaptive reader will use the documented all-sheets API rather than relying on private package internals.

### Existing PDF and persistence findings

- Financial Statements already exposes a `Print / PDF` button backed by `window.print()`, but it prints only the currently selected face statement and contains no signing configuration.
- The report page also uses the browser print dialog for its current preview.
- Existing print CSS correctly establishes A4 output but only exposes `.paper-sheet` or the report preview.
- Company data is stored in IndexedDB through Dexie and included in White Horse backup/restore. Optional signature metadata is stored on the reporting-period record, because signatories, signing dates and UDINs can differ by year. This requires no new table or indexed key; old records and schema-version-1 backups remain structurally compatible because the field is optional and defaults are applied at read/render time.

### Official-source research and legal presentation decision

- Companies Act, 2013, section 134(1), as published by MCA, states that financial statements are approved by the Board before being signed on behalf of the Board by the authorised chairperson or by two directors (one being the managing director, if any), along with the CEO, CFO and company secretary wherever appointed; an OPC uses one director. Section 134(2) says the auditor’s report is attached to every financial statement. Source: https://www.mca.gov.in/bin/ebook/dms/getdocument?doc=NTk2MQ%3D%3D&docCategory=Acts&type=open
- ICAI states that UDIN is placed immediately after the membership number when signing audit reports. ICAI’s current FAQ also distinguishes the financial statements from the audit report and says UDIN is required on the audit report, not additionally on the financial statements. Sources: https://icai.org/post/15671 and https://www.udin.icai.org/pdf/FAQs%20on%20UDIN%20%285th%20Edition%29.pdf
- MDN documents that `window.print()` opens the browser print dialog and that `@media print` / `@page` are the standard web mechanisms for a page formatted for paper or PDF. Sources: https://developer.mozilla.org/en-US/docs/Web/API/Window/print and https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing

Accordingly, the UI will not present a single Director field as if it always satisfies section 134, and it will not describe the CA block as a statutory auditor signature unless the user selects that role. The first implementation will provide configurable presentation/signing placeholders and identity metadata, not a stored image of a handwritten signature and not an electronic/digital signature. The output will carry a clear draft/preparation warning unless the reporting period is finalised.

### Planned implementation and verification

1. Replace the narrow parser with a deterministic adaptive detector and explicit import mapping model.
2. Add worksheet/header selection and column-role mapping to the import modal; prevent activation until required roles and exact TB balance checks pass.
3. Add targeted unit tests for title rows, later worksheets, name-only files, debit/credit pairs, signed balance with Dr/Cr, parenthesised/Indian-formatted values, totals exclusion, duplicates and manual override mappings.
4. Add optional reporting-period signing configuration, independent show/hide controls and audited updates.
5. Add a full print/PDF pack containing Balance Sheet, Profit and Loss, Cash Flow, notes and the ratio schedule, followed by the selected signing blocks.
6. Verify type-check, tests, production build, dependency audit, browser import flows, PDF print layout, IndexedDB persistence and backup compatibility before any Git commit or public deployment.

### Implementation completed

#### Adaptive Trial Balance parser

`src/services/trialBalanceImport.ts` was replaced with a typed, deterministic import pipeline. It now:

- accepts `.xlsx`, `.csv`, `.tsv`, and delimited `.txt` files;
- detects comma, tab, semicolon, and pipe delimiters;
- reads all XLSX worksheets and enforces a 200,000-row workbook inspection limit;
- scores the first 50 rows of each worksheet as one-row and two-tier header candidates;
- exposes the selected worksheet, header row/depth, confidence, available columns, semantic mapping, and sample values in the preview;
- recognises broad explicit aliases for ledger/account identity, groups, opening balances, period movements, closing balances, comparative balances, and Dr/Cr indicators;
- supports separate closing debit/credit, opening plus movements, signed balances with `DR`/`CR` suffixes, and signed balances with a separate direction column;
- requires an explicit debit-positive or credit-positive convention when a signed value has no directional evidence;
- makes ledger code optional and generates `AUTO-<source-row>` codes with a visible warning;
- skips blank/title/narration rows without balances and excludes exact Total/Grand Total/Control Total/Net Total rows;
- converts all monetary values to integer paise, validates safe-integer limits, blocks duplicate codes/both-sides balances, and requires exact debit/credit equality before activation; and
- records selected worksheet/header metadata in the immutable import audit event.

`src/pages/TrialBalancePage.tsx` now keeps the selected file in memory for the session and provides worksheet selection, header-row/depth correction, 16 semantic role selectors, signed-balance convention selection, re-detection, re-validation, detected samples, and the statuses `STANDARD FORMAT`, `ADAPTIVE IMPORT READY`, `MAPPING REQUIRED`, and `IMPORT BLOCKED`. Selecting another file clears the previous preview/errors, and selecting the same filename again works because the file input is reset.

The standard `WH-TB-1.0` templates remain available as the preferred repeatable onboarding format, but they are no longer a forced prerequisite for a compatible direct accounting export.

#### Signing controls and PDF pack

- Added optional `StatementSignatureSettings` to `ReportingPeriod`, rather than Company, so each financial year can have different signatories, dates and UDIN.
- Added central validation/normalisation for independent visibility toggles, required names/designations, eight-digit DIN syntax, six-digit ICAI membership-number syntax, optional 18-character UDIN syntax, place/date, field lengths, and signing-date chronology. These checks validate syntax only; they do not query MCA or ICAI records.
- Added `updateStatementSignatureSettings` as an audited IndexedDB write. Finalised periods reject changes.
- Added **PDF & signatures** in Financial Statements. Director fields render at lower left; CA capacity/firm/signing person/membership fields render at lower right. FRN and UDIN are optional. Each side can be hidden independently.
- Signing output is deliberately an unsigned text block and signature line. No handwritten image, electronic signature, digital certificate, or auditor’s report is stored or created.
- Added a print-only six-section A4 pack: cover, Balance Sheet, Statement of Profit and Loss, Cash Flow Statement, Notes to Accounts, and analytical ratio schedule. Long sections may paginate naturally. **Export PDF** calls the standards-based browser print dialog; the user chooses **Save as PDF**.
- Printed statement rows are plain text rather than inert drill-down buttons. The ratio page is a flex column so its end-of-pack footer remains anchored at the page bottom.

#### Tests added or extended

`src/services/trialBalanceImport.test.ts` now covers 11 import scenarios: quoted comparative CSV, unbalanced TB, name-only direct export with generated codes, a later workbook worksheet plus title rows, two-tier headers, Dr/Cr suffixes, required unsigned convention, separate Dr/Cr indicator, semicolon delimiter, manual mapping, and taxonomy suggestion. The existing real XLSX template test continues to pass with the all-sheet reader.

`src/domain/signatureSettings.test.ts` covers hidden blocks, valid normalisation, missing required fields, invalid DIN/membership/UDIN, and signing date before period end. `src/db.test.ts` verifies persistence across IndexedDB reopen and the signature-settings audit event. `src/components/FinancialPdfPack.test.tsx` verifies all statements, notes, ratios, Director/DIN, and CA/membership in the rendered pack.

### Automated verification and encountered errors

```powershell
npm run typecheck
# passed

npm test
# pre-final-review run: 15 test files, 46/46 tests passed

npm run build
# passed with Vite 8.3.1; 186 modules
# CSS 56.09 kB / 11.14 kB gzip
# TrialBalance chunk 39.12 kB / 11.89 kB gzip
# Statements chunk 21.19 kB / 5.10 kB gzip
# entry 406.34 kB / 124.88 kB gzip
# PWA precache 25 entries / 721.56 KiB
```

Two importer tests initially failed:

1. The two-tier fixture’s second header row independently formed a valid single-row layout, so the scoring algorithm correctly selected depth one. The fixture was corrected so the parent row is necessary to derive the semantic label.
2. `GL Account` and generic `Amount` were not yet in the explicit alias table. They were added; the latter still requires Dr/Cr evidence or an explicit sign convention.

Both were fixture/coverage discoveries, not relaxed validation. The complete suite passed afterward.

Final code review found a further safety edge case: because all worksheets are scored, the populated `Worked Example` in the downloadable standard workbook could outrank its intentionally blank `Trial Balance Import` sheet on numeric evidence. Automatic detection now excludes worksheets clearly named Instructions, Read Me, Guide, Worked Example, Example, or Sample whenever another candidate sheet exists; the user can still select one explicitly. A regression test covers this synthetic-data isolation and the real distributed XLSX is now parsed end-to-end to prove the blank import sheet is selected. This increases the final suite to 47 tests.

### Production-bundle browser QA

The production bundle was served locally at `http://127.0.0.1:4183/white-horse/`. A semicolon-delimited synthetic export containing two title rows, name-only ledgers, `Debit Amount`/`Credit Amount`, and a duplicate Total row was uploaded through the real UI. The importer reported:

```text
Status:        ADAPTIVE IMPORT READY
Worksheet:     Delimited import
Header:        Row 3
Confidence:    HIGH
Ledger rows:   2
Debit:         ₹1,000
Credit:        ₹1,000
Difference:    0
Warnings:      generated ledger codes; one Total row excluded; no comparative columns
```

A second export used wholly unknown headings `Vendor Field A/B/C`. The UI correctly showed `MAPPING REQUIRED`. Mapping Field A to Ledger Name, Field B to Closing Debit, and Field C to Closing Credit changed the same session to `ADAPTIVE IMPORT READY`, with two rows and exact balanced totals. Neither synthetic import was activated, so the demonstration company’s active TB remained unchanged.

Browser automation exposed two harness-specific issues:

- Chrome file upload was blocked because the installed browser extension did not have local-file URL access. The same authorised local upload was completed through the Codex in-app browser; no Chrome setting was changed.
- The in-app browser’s high-level Playwright button click did not fire some React click handlers, although file-input and field interactions worked. Visible accessibility/coordinate controls were used for those buttons. This was an automation-adapter limitation; the controls worked through real UI activation and browser console errors/warnings remained zero.

The signature form was then tested with synthetic local values: Director `Asha Rao`, DIN `12345678`, preparer firm `Rao & Co.`, signing CA `Vikram Rao`, and membership `123456`. Saving displayed the Director at the statement’s lower left and the CA at lower right. A full reload retained both blocks, confirming IndexedDB persistence. Read-only DOM inspection confirmed six print sections and the presence of Balance Sheet, Statement of Profit and Loss, Cash Flow Statement, Notes to Accounts, analytical ratio schedule, and both signature identifiers. The print pack remains hidden on screen and is exposed only by print media. Browser console issues: zero.

### Documentation synchronisation

Updated `README.md`, `docs/TRIAL_BALANCE_IMPORT_FORMAT.md`, `docs/USER_GUIDE.md`, `docs/DATABASE_SCHEMA.md`, `docs/REPORT_CATALOG.md`, `docs/FUNCTIONAL_ARCHITECTURE.md`, `PRIVACY.md`, and `SECURITY.md` to document the adaptive-import boundary, manual mapping, standards-based PDF workflow, reporting-period signature metadata, privacy implications, and the explicit limitation that the blocks are not signatures or an auditor’s report.

### Final local release gate

After the worked-example safeguard and documentation updates, the complete gate was rerun:

```powershell
npm run typecheck
# passed

npm test
# 15 test files, 47/47 tests passed

npm run build
# passed; Vite 8.3.1; 186 modules
# CSS 56.14 kB / 11.14 kB gzip
# TrialBalance chunk 39.25 kB / 11.95 kB gzip
# Statements chunk 21.19 kB / 5.10 kB gzip
# entry 406.34 kB / 124.88 kB gzip
# PWA precache 25 entries / 721.73 KiB

npm audit --audit-level=moderate
# restricted attempt could not reach the official npm audit endpoint or write its host cache log
# approved official-registry retry: found 0 vulnerabilities

git diff --check
# passed
```

A focused repository scan found no AWS access-key identifiers, GitHub token patterns, private-key blocks, or the user’s personal email address. Git identity is `Anshum <105625445+anshum940@users.noreply.github.com>` and the only remote is `https://github.com/anshum940/white-horse.git`.

The first staging attempt could not create `.git/index.lock` because the managed workspace grants normal write access to project files but not the Git metadata directory. No files were staged by that attempt. The approved repository-scoped Git retry succeeded; `git diff --cached --check` passed and the staged set contains only the 24 reviewed source, test, and documentation files for this release.

### Release completion, GitHub authentication and public deployment

The reviewed release was committed locally as:

```text
fe0cbff feat: add adaptive TB import and signed PDF pack
24 files changed, 1705 insertions(+), 325 deletions(-)
```

The first fresh GitHub CLI device-login attempt reached GitHub's additional account-verification step but expired before that private verification was completed. It did not push or change the repository. A second fresh device flow was then completed by the user in the browser. Ephemeral device and verification codes are intentionally not stored in this project log.

Before the authenticated operation, identity and repository targeting were revalidated:

```powershell
gh auth status --hostname github.com
gh api user --jq '{login: .login, id: .id}'
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project config user.name
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project config user.email
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project remote -v
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project status --short --branch
```

Verified results:

```text
Active GitHub account: anshum940
GitHub numeric id:     105625445
Git author:            Anshum <105625445+anshum940@users.noreply.github.com>
Push remote:           https://github.com/anshum940/white-horse.git
Branch before push:    main, ahead of origin/main by exactly one commit
```

The feature commit was published with:

```powershell
git -c safe.directory=C:/Users/anshu/Documents/Personal/CA-project push origin main
```

Push result:

```text
To https://github.com/anshum940/white-horse.git
   cbb7647..fe0cbff  main -> main
```

The exact workflow was discovered and monitored with:

```powershell
gh run list --repo anshum940/white-horse --branch main --limit 8 --json databaseId,headSha,status,conclusion,url,workflowName,createdAt,event,displayTitle
gh run watch 36386673937 --repo anshum940/white-horse --exit-status
```

GitHub Actions run [36386673937](https://github.com/anshum940/white-horse/actions/runs/36386673937), **Verify and deploy White Horse**, completed successfully for full SHA `fe0cbffbce6fbb1389d94399c3ee4a342b78dbf0`. Job `108813380944` passed checkout, locked dependency installation, dependency audit, type-check, tests, production PWA build, GitHub Pages configuration and artifact upload. Job `108813509921` deployed the artifact to Pages successfully. GitHub reported only its informational notice that the `ubuntu-latest` label will migrate to Ubuntu 26 beginning 19 October 2026; this did not affect the run.

### Public HTTPS and production-browser verification

The deployed release was opened at `https://anshum940.github.io/white-horse/?build=fe0cbff` in the signed-in test browser. The existing service worker initially announced **A verified update is available**. Selecting **Update** activated the new release. The existing browser-local company and preparer remained visible afterward, demonstrating that this deployment did not clear the site's IndexedDB data.

Read-only live checks confirmed:

- the application document returns HTTP `200`, `text/html; charset=utf-8`;
- the response sends `Strict-Transport-Security: max-age=31556952`;
- `/white-horse/assets/index-Dscc2BlK.js` returns HTTP `200` as JavaScript;
- `/white-horse/assets/index-Bqij8vIm.css` returns HTTP `200` as CSS;
- `/white-horse/manifest.webmanifest` returns HTTP `200` as a web-app manifest; and
- `/white-horse/sw.js` returns HTTP `200` as JavaScript.

The production UI was inspected after the update. The **Import Trial Balance** dialog contains the `WH-TB-1.0` XLSX and CSV templates and states that White Horse detects worksheets, scans the first 50 rows, accepts XLSX/CSV/TSV/delimited TXT, and opens a column mapper for unclear meanings. The **Financial statements** module exposes **PDF & signatures** and **Export PDF**. The signing dialog provides independent Director and Chartered Accountant visibility controls; enabling them without saving exposed Director name/designation/eight-digit DIN fields at lower left and CA capacity/firm/signing-person/six-digit ICAI membership/optional UDIN fields at lower right. The QA-only toggles were cancelled, so no live company setting was changed.

The live Export PDF control was not invoked because it intentionally opens the operating-system print dialog. Its six-section print DOM, statement content and signing identifiers had already been verified against the production build in local browser QA and component tests. PDF creation therefore remains a user-controlled browser **Save as PDF** action rather than a server upload.

GitHub's official documentation confirms that `github.io` Pages sites are served over HTTPS automatically and documents HSTS-compatible HTTPS enforcement: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https. The public release URL is:

```text
https://anshum940.github.io/white-horse/
```

### Final result and next operational steps

The requested adaptive Trial Balance workflow, standards-based PDF export, and independently configurable Director/CA signing blocks are implemented, tested, published and verified on the public HTTPS site. Existing companies remain browser-local to the same origin and browser profile; deployment updates do not erase them. Because GitHub Pages is static hosting, there is no central multi-device database or account sync in this release. Before commercial use, the product still needs customer tenancy/authentication, encrypted managed storage and backup/restore policy, authorization controls, server-side audit retention, monitoring/support, legal/privacy terms, and professional Schedule III/statutory review. Scanned documents, legacy `.xls`, password-protected/corrupt workbooks and proprietary non-tabular exports remain outside the adaptive importer and must first be exported to a supported tabular format.

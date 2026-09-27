# Deployment and operations

## Architecture decision

White Horse is deployed as a static local-first PWA on GitHub Pages. This gives the study demo a stable HTTPS URL without keeping a laptop, local server, ngrok agent, or Cloudflare tunnel running. Workspace records remain in each visitor's browser; the public build contains only application code and synthetic seed data.

## Repository and base path

The intended public repository name is `white-horse`. Vite is configured with `base: '/white-horse/'`, so the expected site address is:

```text
https://anshum940.github.io/white-horse/
```

If the repository name changes, update the Vite base path, PWA navigation fallback, documentation, and URL tests before deployment.

## Authentication and identity controls

1. Never infer the GitHub identity from a saved credential or email address.
2. Run a fresh `gh auth login --hostname github.com --git-protocol https --web` device/browser flow.
3. The user completes authorisation in the browser.
4. Verify the active identity with `gh auth status` and `gh api user`.
5. Set repository-local `user.name` and a verified GitHub no-reply email before committing.
6. Confirm the destination repository does not conflict with unrelated work.

Do not print access tokens or use `gh auth status --show-token`.

## GitHub Pages workflow

`.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch. It:

1. checks out the exact commit;
2. installs the locked npm dependency graph on Node.js 24;
3. fails on a moderate-or-higher npm advisory;
4. type-checks and runs the full test suite;
5. builds the production PWA;
6. uploads only `dist` as the Pages artifact; and
7. deploys through the protected `github-pages` environment.

Third-party actions are pinned to immutable commit SHAs. Dependabot checks npm and action updates monthly. The build job has only `contents: read`; only the deployment job receives `pages: write` and OIDC `id-token: write`.

## First deployment

After the public repository is pushed:

1. Set the Pages build type/source to **GitHub Actions** through repository settings or the GitHub API.
2. Observe the workflow through `gh run list` and `gh run watch`.
3. Require a successful build and deploy job.
4. Open the workflow-provided `page_url` over HTTPS.
5. Verify overview, hash navigation, manifest/icon, Trial Balance controls, workbook export, console, and offline reload.

## Rollback

Do not rewrite published history. Revert the faulty commit on `main`, run the full local gate, and push the revert. The Pages workflow publishes the last verified commit. GitHub Actions retains workflow history; application data in visitors' IndexedDB is independent of a static-code rollback, so schema migrations must remain backward compatible or include an explicit recovery plan.

## Availability and recovery

- GitHub Pages availability governs the online shell; already cached compatible clients may continue offline.
- There is no central application database to restore.
- User-created browser workspaces require user-managed verified backups.
- A public demo must never depend on a single untested browser profile; verify the URL and synthetic seed in a clean profile before the study session.

## Authoritative references

- Vite static deployment: https://vite.dev/guide/static-deploy.html
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub CLI web authentication: https://cli.github.com/manual/gh_auth_login

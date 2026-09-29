# Security policy and operating boundary

## Supported version

The current `main` branch is the only supported demonstration version.

## Reporting a vulnerability

Use GitHub's private vulnerability-reporting channel for the repository when available. Do not include client financial data, credentials, tokens, or other secrets in a public issue. A report should contain the affected version, reproduction steps using synthetic data, impact, and a proposed mitigation if known.

## Security controls in this release

- No application backend, server-side database, or embedded cloud credentials
- Strict Content Security Policy for the static application
- Exact integer-paise accounting arithmetic and deterministic control checks
- PBKDF2/AES-GCM encrypted backup option
- SHA-256 content and audit-event hashes
- File extension/content parsing, size, workbook/worksheet row-count, duplicate-code, semantic mapping, and exact-balance validation on import
- Locked dependency graph, automated dependency audit, Dependabot, and GitHub Actions pinned to immutable commits
- Least-privilege Pages workflow permissions
- A tab-scoped study-access marker and a password digest comparison that avoids retaining the entered password in browser storage
- A single-confirmation factory-reset transaction that either replaces all local records with the synthetic seed or rolls back

## Known boundary

White Horse is a local-first demonstration, not a multi-user security boundary. The public GitHub Pages login accepts the documented `admin` / `admin123` study credential entirely in client code. Its temporary failed-attempt delay and tab-scoped session marker improve presentation and accidental-access control only; they can be reset or bypassed and do not protect the static bundle or browser database from someone with device/developer-tool access. IndexedDB is not encrypted at rest, and the seeded local roles illustrate workflow segregation but do not authenticate separate human users.

Before production use, replace the study cover with a formally reviewed server-side or managed identity provider, secure HTTP-only sessions, per-tenant and per-object authorisation, encrypted persistence, key management, rate limiting, monitoring, secure update governance, backup retention controls, audit-log verification, threat modelling, and independent penetration testing. Never reuse `admin123` or another shared credential in a real deployment.

Never commit or deploy real Trial Balances, backups, workpapers, signing identifiers (including DIN, ICAI membership number or UDIN), credentials, environment files, or generated reports. The repository ignores common exported file types, but that is only a safeguard—not a data-loss-prevention control.

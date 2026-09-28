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

## Known boundary

White Horse is a local-first demonstration, not a multi-user security boundary. IndexedDB is not encrypted at rest; the seeded local roles illustrate workflow segregation but do not authenticate separate human users. Before production use, add a formally reviewed identity model, authorisation enforcement, encrypted persistence, key management, secure update governance, backup retention controls, audit-log verification, threat modelling, and independent penetration testing.

Never commit or deploy real Trial Balances, backups, workpapers, signing identifiers (including DIN, ICAI membership number or UDIN), credentials, environment files, or generated reports. The repository ignores common exported file types, but that is only a safeguard—not a data-loss-prevention control.

# Privacy boundary

## What stays in the browser

White Horse has no application backend. Imported Trial Balance contents, mappings, adjustments, notes, validations, users, and audit events are stored in IndexedDB for the current site origin and browser profile. File parsing, accounting calculations, and report generation occur in the browser.

The application does not include analytics, advertising, or telemetry SDKs.

## What hosting can observe

GitHub Pages serves the static HTML, JavaScript, CSS, manifest, icon, and service-worker files. As with any hosted website, the hosting platform and network providers may process normal request metadata such as IP address, user agent, requested paths, and timestamps under their own policies. No White Horse workspace data is intentionally sent to GitHub by application code.

## Local storage limitations

- IndexedDB data is isolated by browser profile and origin, but it is not encrypted by White Horse at rest.
- Anyone with sufficient access to the device or browser profile may be able to inspect local data.
- Clearing site data, using private browsing, storage eviction, or changing the origin can remove or isolate the workspace.
- Service-worker caches contain the public application shell, not imported Trial Balance records.

## User-controlled exports

CSV, XLSX, print/PDF, and backup files leave browser storage only when the user explicitly generates or selects them. Plain JSON backups are readable. Encrypted `.whbackup` files use a user-supplied passphrase with PBKDF2-derived AES-GCM encryption; losing the passphrase makes recovery impractical.

## Public demonstration rule

Use only the bundled synthetic Saffron Industries data in a public study demonstration. Do not import identifiable client, employer, tax, banking, payroll, or other confidential records into a publicly demonstrated browser profile.

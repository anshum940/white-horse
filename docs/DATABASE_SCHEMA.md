# White Horse Database Schema

## 1. Persistence approach

White Horse uses IndexedDB through Dexie. The database name is namespaced by product and environment, for example `white-horse-production`. Schema changes use monotonic integer versions and explicit migration functions.

All identifiers are UUIDs generated with `crypto.randomUUID()`. All dates are stored as ISO 8601 strings; business dates use `YYYY-MM-DD`, while audit timestamps use UTC instants. Monetary values are integer paise (`number`) and must remain within JavaScript's safe-integer range. An import exceeding that range is blocked.

Every company-owned record carries `companyId`. Every period-owned record also carries `periodId`. No repository method accepts an unscoped read for company financial data.

## 2. Enumerations

- `Framework`: `SCHEDULE_III_DIV_I`, `SCHEDULE_III_DIV_II`, `SCHEDULE_III_DIV_III`
- `Role`: `ADMIN`, `PREPARER`, `REVIEWER`, `VIEWER`
- `PeriodStatus`: `DRAFT`, `TB_IMPORTED`, `MAPPING_IN_PROGRESS`, `ADJUSTMENT_IN_PROGRESS`, `REVIEW`, `READY_FOR_REVIEW`, `FINALISED`, `REOPENED`
- `ImportStatus`: `STAGED`, `VALIDATED`, `ACTIVE`, `SUPERSEDED`, `REJECTED`
- `MappingStatus`: `DRAFT`, `SUBMITTED`, `APPROVED`, `LOCKED`, `SUPERSEDED`
- `AdjustmentStatus`: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `POSTED`, `REVERSED`
- `Severity`: `BLOCKING`, `ERROR`, `WARNING`, `INFO`
- `RagStatus`: `RED`, `AMBER`, `GREEN`
- `NormalBalance`: `DEBIT`, `CREDIT`, `EITHER`
- `StatementType`: `BALANCE_SHEET`, `PROFIT_LOSS`, `CASH_FLOW`, `CHANGES_IN_EQUITY`, `NOTE`, `DISCLOSURE`

## 3. Store definitions

The index notation below is conceptual; final Dexie syntax is defined in the implementation and migration tests.

### 3.1 `appSettings`

Primary key: `key`

Fields: `key`, `value`, `updatedAt`, `updatedBy`, `schemaVersion`.

Stores non-sensitive application preferences, active taxonomy version, backup reminders, and installation identifier. No passphrase or raw key is stored.

### 3.2 `users`

Primary key: `id`; unique index: `normalizedUsername`; indexes: `role`, `active`.

Fields:

- `id`, `username`, `normalizedUsername`, `displayName`, `role`, `active`
- `passwordSalt`, `passwordVerifier`, `kdf`, `kdfIterations`, `hashAlgorithm`
- `failedAttempts`, `lockedUntil`, `lastLoginAt`
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

The verifier is derived from the passphrase; the passphrase is never stored.

### 3.3 `companies`

Primary key: `id`; indexes: `legalName`, `cin`, `active`.

Fields: `id`, `legalName`, `tradeName`, `cin`, `panMasked`, `registeredOffice`, `industry`, `framework`, `currency`, `displayScale`, `decimalPlaces`, `dateOfIncorporation`, `boardMetadata`, `auditorMetadata`, `active`, audit metadata.

### 3.4 `reportingPeriods`

Primary key: `id`; compound unique key enforced in service: `(companyId, startDate, endDate, revision)`; indexes: `companyId`, `[companyId+status]`, `endDate`.

Fields: `id`, `companyId`, `label`, `startDate`, `endDate`, `comparativePeriodId`, `framework`, `taxonomyVersion`, `status`, `revision`, `materialityPaise`, `roundingPolicy`, `mappingVersionId`, `activeImportId`, `signatureSettings`, `finalisedSnapshotId`, `createdAt`, `updatedAt`, `finalisedAt`, `finalisedBy`.

`signatureSettings` is optional period-level metadata because signatories and signing dates can change between reporting periods. It contains independent Director/CA visibility flags; Director name, designation and DIN; CA capacity, firm, optional FRN, signing name, designation, ICAI membership number and optional UDIN; and common place/date. Updates are validated, audited, and rejected after finalisation. The fields render an unsigned text block and signature line; no handwritten, electronic, or digital signature is stored.

### 3.5 `tbImports`

Primary key: `id`; indexes: `[companyId+periodId]`, `status`, `importedAt`, `contentHash`.

Fields: `id`, `companyId`, `periodId`, `version`, `sourceType`, `sourceFileName`, `sourceFileSize`, `contentHash`, `columnMap`, `numberFormat`, `rowCount`, `debitTotalPaise`, `creditTotalPaise`, `differencePaise`, `status`, `validationSummary`, `importedAt`, `importedBy`, `supersedesImportId`, `reason`.

Original source files are not persisted by default. A content hash, filename, size, and row-level source reference provide provenance without retaining unnecessary personal information.

### 3.6 `ledgerAccounts`

Primary key: `id`; unique service constraint: `(companyId, normalizedCode)`; indexes: `companyId`, `[companyId+normalizedCode]`, `normalizedName`, `active`.

Fields: `id`, `companyId`, `code`, `normalizedCode`, `name`, `normalizedName`, `group`, `subGroup`, `normalBalance`, `active`, `createdFromImportId`, audit metadata.

### 3.7 `tbLines`

Primary key: `id`; indexes: `importId`, `[companyId+periodId]`, `ledgerAccountId`, `sourceRowNumber`.

Fields: `id`, `companyId`, `periodId`, `importId`, `ledgerAccountId`, `sourceRowNumber`, `sourceSheet`, `openingDebitPaise`, `openingCreditPaise`, `movementDebitPaise`, `movementCreditPaise`, `reportedClosingDebitPaise`, `reportedClosingCreditPaise`, `calculatedSignedClosingPaise`, `comparativeSignedClosingPaise`, `rawGroup`, `rawSubGroup`, `rowHash`, `warnings`.

Rows from an activated import are immutable. Corrections require a new import version.

### 3.8 `taxonomyNodes`

Primary key: `id`; indexes: `[framework+taxonomyVersion]`, `parentId`, `code`, `statementType`, `sortOrder`.

Fields: `id`, `framework`, `taxonomyVersion`, `code`, `label`, `shortLabel`, `statementType`, `parentId`, `level`, `sortOrder`, `normalBalance`, `isCurrent`, `noteRequired`, `cashFlowClass`, `ratioTags`, `presentationRule`, `effectiveFrom`, `effectiveTo`, `sourceReference`.

Seed taxonomies are build assets copied into the local database. User-defined nodes are stored with `origin: USER` and cannot overwrite seeded identifiers.

### 3.9 `mappingVersions`

Primary key: `id`; indexes: `[companyId+periodId]`, `status`, `version`.

Fields: `id`, `companyId`, `periodId`, `version`, `status`, `taxonomyVersion`, `basedOnVersionId`, `createdAt`, `createdBy`, `submittedAt`, `submittedBy`, `approvedAt`, `approvedBy`, `lockedAt`, `lockReason`, `contentHash`.

### 3.10 `ledgerMappings`

Primary key: `id`; unique service constraint: `(mappingVersionId, ledgerAccountId)`; indexes: `mappingVersionId`, `ledgerAccountId`, `taxonomyNodeId`, `status`.

Fields: `id`, `companyId`, `periodId`, `mappingVersionId`, `ledgerAccountId`, `taxonomyNodeId`, `noteNodeId`, `cashFlowClass`, `currentNonCurrent`, `maturityDate`, `relatedParty`, `expectedBalance`, `suggestionConfidence`, `suggestionReason`, `status`, `reviewComment`, audit metadata.

### 3.11 `adjustments`

Primary key: `id`; unique service constraint: `(companyId, periodId, referenceNumber)`; indexes: `[companyId+periodId]`, `status`, `type`, `preparedBy`, `reviewedBy`.

Fields: `id`, `companyId`, `periodId`, `referenceNumber`, `type`, `entryDate`, `narration`, `workpaperReference`, `evidenceDescription`, `status`, `reversing`, `reversalDate`, `preparedBy`, `preparedAt`, `submittedAt`, `reviewedBy`, `reviewedAt`, `reviewComment`, `postedAt`, `postedBy`, `reversalOfAdjustmentId`, `contentHash`.

### 3.12 `adjustmentLines`

Primary key: `id`; indexes: `adjustmentId`, `ledgerAccountId`, `taxonomyNodeId`.

Fields: `id`, `adjustmentId`, `lineNumber`, `ledgerAccountId`, `taxonomyNodeId`, `debitPaise`, `creditPaise`, `description`.

The service enforces positive values, never both debit and credit on one line, at least two lines, and total debits equal total credits before submission/posting.

### 3.13 `noteDisclosures`

Primary key: `id`; unique service constraint: `(companyId, periodId, taxonomyNodeId, version)`; indexes: `[companyId+periodId]`, `taxonomyNodeId`, `status`.

Fields: `id`, `companyId`, `periodId`, `taxonomyNodeId`, `version`, `title`, `contentBlocks`, `currentAmountPaise`, `comparativeAmountPaise`, `status`, `preparedBy`, `reviewedBy`, audit metadata.

Structured `contentBlocks` support narrative, table, accounting policy, cross-reference, and user-defined disclosure components. Renderers never interpret raw HTML.

### 3.14 `validationRuns`

Primary key: `id`; indexes: `[companyId+periodId]`, `startedAt`, `rulesetVersion`, `completed`.

Fields: `id`, `companyId`, `periodId`, `rulesetVersion`, `datasetHash`, `startedAt`, `completedAt`, `startedBy`, `completed`, `blockingCount`, `errorCount`, `warningCount`, `infoCount`, `ragStatus`.

### 3.15 `validationResults`

Primary key: `id`; indexes: `runId`, `ruleId`, `severity`, `status`, `entityType`, `entityId`.

Fields: `id`, `runId`, `ruleId`, `severity`, `title`, `message`, `evidence`, `amountPaise`, `entityType`, `entityId`, `taxonomyNodeId`, `suggestedAction`, `status`, `resolution`, `resolvedBy`, `resolvedAt`, `overrideReason`, `overrideApprovedBy`.

Blocking results cannot be overridden. Error/warning overrides require reason and reviewer approval.

### 3.16 `reviewComments`

Primary key: `id`; indexes: `[companyId+periodId]`, `entityType`, `entityId`, `status`, `assignedTo`.

Fields: `id`, `companyId`, `periodId`, `entityType`, `entityId`, `body`, `status`, `priority`, `createdBy`, `createdAt`, `assignedTo`, `resolvedBy`, `resolvedAt`, `resolution`.

### 3.17 `approvals`

Primary key: `id`; indexes: `[companyId+periodId]`, `entityType`, `entityId`, `decision`.

Fields: `id`, `companyId`, `periodId`, `entityType`, `entityId`, `entityVersion`, `decision`, `comment`, `decidedBy`, `decidedAt`, `contentHash`.

### 3.18 `reportRuns`

Primary key: `id`; indexes: `[companyId+periodId]`, `reportType`, `generatedAt`, `snapshotId`.

Fields: `id`, `companyId`, `periodId`, `reportType`, `templateVersion`, `datasetHash`, `snapshotId`, `parameters`, `generatedAt`, `generatedBy`, `status`, `outputHash`, `unresolvedWarnings`.

Generated binary reports are downloaded, not permanently stored in IndexedDB by default.

### 3.19 `finalisationSnapshots`

Primary key: `id`; unique service constraint: `(companyId, periodId, revision)`; indexes: `[companyId+periodId]`, `createdAt`, `contentHash`.

Fields: `id`, `companyId`, `periodId`, `revision`, `importVersion`, `mappingVersion`, `adjustmentIds`, `taxonomyVersion`, `rulesetVersion`, `statementData`, `validationSummary`, `approvals`, `contentHash`, `previousSnapshotHash`, `createdAt`, `createdBy`.

Snapshots are immutable. Reopening creates a later revision and preserves the prior snapshot.

### 3.20 `auditEvents`

Primary key: `id`; indexes: `sequence`, `[companyId+periodId]`, `timestamp`, `actorId`, `entityType`, `entityId`, `action`.

Fields: `id`, `sequence`, `installationId`, `companyId`, `periodId`, `timestamp`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `entityVersion`, `reason`, `beforeDigest`, `afterDigest`, `metadata`, `previousEventHash`, `eventHash`.

Audit events are append-only through the application service. Export verification recomputes the hash chain.

### 3.21 `backupHistory`

Primary key: `id`; indexes: `createdAt`, `type`, `status`.

Fields: `id`, `type`, `schemaVersion`, `databaseHash`, `encrypted`, `createdAt`, `createdBy`, `fileName`, `fileSize`, `status`, `verifiedAt`, `notes`.

The backup file itself is downloaded to a user-selected location; history records only metadata.

## 4. Transaction boundaries

- Activate import: `tbImports`, `tbLines`, `ledgerAccounts`, `reportingPeriods`, `auditEvents`.
- Approve/lock mappings: `mappingVersions`, `ledgerMappings`, `approvals`, `reportingPeriods`, `auditEvents`.
- Post adjustment: `adjustments`, `adjustmentLines`, `auditEvents`; reject if unbalanced or mapping is invalid.
- Resolve validation: `validationResults`, `reviewComments`, `approvals`, `auditEvents`.
- Finalise period: all prerequisite reads plus atomic write to `finalisationSnapshots`, `reportingPeriods`, `approvals`, `auditEvents`.
- Restore: performed against a temporary database; live replacement is a separate explicitly confirmed operation with pre-restore backup.

## 5. Integrity constraints

1. A period belongs to exactly one company.
2. An active import is unique per period.
3. A ledger mapping is unique per mapping version and ledger.
4. Locked mapping versions are immutable.
5. Posted adjustments and their lines are immutable; correction uses reversal/new adjustment.
6. Adjustment debits equal credits exactly in paise.
7. Finalised periods reject writes except authorised reopening.
8. Referential targets must share the same company and period scope.
9. Finalisation requires hashes for the active import, locked mapping, posted adjustments, validation run, approvals, and snapshot.
10. Deletions use archival/inactive status for master records and supersession for financial records; no hard deletion after use.

## 6. Schema migration policy

- Each release records application and database schema versions.
- Additive migrations are preferred.
- Destructive transformations require an automatic verified backup and a restore test fixture.
- Migrations must be idempotent in test and covered from every supported previous version.
- A migration failure leaves the original database untouched and opens a recovery screen.
- Taxonomy and validation-rule versions are data versions separate from the IndexedDB schema version.

## 7. Backup package

The logical backup contains:

```text
manifest.json
  formatVersion
  applicationVersion
  schemaVersion
  createdAt
  installationId
  tableCounts
  payloadHash
  encryption metadata (when encrypted)
payload.json or payload.enc
```

Restore validates the format version, schema compatibility, payload hash/authentication tag, table counts, referential integrity, audit chain, and finalisation snapshot hashes before offering replace/merge choices.

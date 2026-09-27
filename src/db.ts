import Dexie, { type EntityTable } from 'dexie';
import {
  demoAdjustmentLines,
  demoAdjustments,
  demoAuditEvents,
  demoCompany,
  demoImport,
  demoLedgers,
  demoMappings,
  demoNotes,
  demoPeriod,
  demoUsers,
  demoValidations
} from './data/demo';
import { taxonomyByCode } from './data/taxonomy';
import { hashRecord } from './domain/security';
import type {
  Adjustment,
  AdjustmentLine,
  AuditEvent,
  Company,
  LedgerAccount,
  LedgerMapping,
  LocalUser,
  NoteDisclosure,
  ReportingPeriod,
  TrialBalanceImport,
  ValidationResult,
  WorkspaceData
} from './domain/types';

export class WhiteHorseDatabase extends Dexie {
  companies!: EntityTable<Company, 'id'>;
  periods!: EntityTable<ReportingPeriod, 'id'>;
  imports!: EntityTable<TrialBalanceImport, 'id'>;
  ledgers!: EntityTable<LedgerAccount, 'id'>;
  mappings!: EntityTable<LedgerMapping, 'id'>;
  adjustments!: EntityTable<Adjustment, 'id'>;
  adjustmentLines!: EntityTable<AdjustmentLine, 'id'>;
  validations!: EntityTable<ValidationResult, 'id'>;
  notes!: EntityTable<NoteDisclosure, 'id'>;
  auditEvents!: EntityTable<AuditEvent, 'id'>;
  users!: EntityTable<LocalUser, 'id'>;

  constructor(name = 'white-horse-production') {
    super(name);
    this.version(1).stores({
      companies: 'id, legalName, cin, active, updatedAt',
      periods: 'id, companyId, [companyId+status], endDate, updatedAt',
      imports: 'id, companyId, periodId, [companyId+periodId], status, importedAt, contentHash',
      ledgers: 'id, companyId, periodId, importId, [companyId+periodId], code, name, group, subGroup',
      mappings: 'id, companyId, periodId, ledgerId, taxonomyCode, status, [periodId+ledgerId]',
      adjustments: 'id, companyId, periodId, [companyId+periodId], referenceNumber, type, status, entryDate',
      adjustmentLines: 'id, adjustmentId, ledgerId, [adjustmentId+lineNumber]',
      validations: 'id, companyId, periodId, [companyId+periodId], ruleId, severity, status, entityId',
      notes: 'id, companyId, periodId, [companyId+periodId], noteNumber, status',
      auditEvents: 'id, sequence, companyId, periodId, [companyId+periodId], timestamp, actorId, action, entityId',
      users: 'id, &username, role, active'
    });
  }
}

export const db = new WhiteHorseDatabase();

export async function initializeDatabase(): Promise<void> {
  const exists = await db.companies.get(demoCompany.id);
  if (exists) return;
  await db.transaction(
    'rw',
    [
      db.companies,
      db.periods,
      db.imports,
      db.ledgers,
      db.mappings,
      db.adjustments,
      db.adjustmentLines,
      db.validations,
      db.notes,
      db.auditEvents,
      db.users
    ],
    async () => {
      await db.companies.add(demoCompany);
      await db.periods.add(demoPeriod);
      await db.imports.add(demoImport);
      await db.ledgers.bulkAdd(demoLedgers);
      await db.mappings.bulkAdd(demoMappings);
      await db.adjustments.bulkAdd(demoAdjustments);
      await db.adjustmentLines.bulkAdd(demoAdjustmentLines);
      await db.validations.bulkAdd(demoValidations);
      await db.notes.bulkAdd(demoNotes);
      await db.auditEvents.bulkAdd(demoAuditEvents);
      await db.users.bulkAdd(demoUsers);
    }
  );
}

export async function loadDemoWorkspace(): Promise<WorkspaceData | undefined> {
  const company = await db.companies.get(demoCompany.id);
  const period = await db.periods.get(demoPeriod.id);
  if (!company || !period) return undefined;
  const activeImport = await db.imports.get(period.activeImportId);
  if (!activeImport) return undefined;

  const [ledgers, mappings, adjustments, adjustmentLines, validations, notes, auditEvents, users] =
    await Promise.all([
      db.ledgers.where('importId').equals(activeImport.id).toArray(),
      db.mappings.where('periodId').equals(period.id).toArray(),
      db.adjustments.where('periodId').equals(period.id).toArray(),
      db.adjustmentLines.toArray(),
      db.validations.where('periodId').equals(period.id).toArray(),
      db.notes.where('periodId').equals(period.id).toArray(),
      db.auditEvents.where('periodId').equals(period.id).sortBy('sequence'),
      db.users.toArray()
    ]);
  const adjustmentIds = new Set(adjustments.map((adjustment) => adjustment.id));
  const ledgerIds = new Set(ledgers.map((ledger) => ledger.id));

  return {
    company,
    period,
    activeImport,
    ledgers,
    mappings: mappings.filter((mapping) => ledgerIds.has(mapping.ledgerId)),
    adjustments,
    adjustmentLines: adjustmentLines.filter((line) => adjustmentIds.has(line.adjustmentId)),
    validations,
    notes,
    auditEvents,
    users
  };
}

export async function nextAuditEvent(
  input: Omit<AuditEvent, 'id' | 'sequence' | 'timestamp' | 'previousEventHash' | 'eventHash'>
): Promise<AuditEvent> {
  const last = await db.auditEvents.orderBy('sequence').last();
  const sequence = (last?.sequence ?? 0) + 1;
  const timestamp = new Date().toISOString();
  const previousEventHash = last?.eventHash ?? 'GENESIS';
  const id = crypto.randomUUID();
  const eventHash = await hashRecord({ ...input, id, sequence, timestamp, previousEventHash });
  return { ...input, id, sequence, timestamp, previousEventHash, eventHash };
}

export async function updateMapping(ledgerId: string, taxonomyCode: string): Promise<void> {
  const mapping = await db.mappings.where('ledgerId').equals(ledgerId).first();
  const ledger = await db.ledgers.get(ledgerId);
  const node = taxonomyByCode.get(taxonomyCode);
  if (!ledger || !node) throw new Error('Ledger or taxonomy node was not found.');
  const event = await nextAuditEvent({
    companyId: ledger.companyId,
    periodId: ledger.periodId,
    actorId: 'demo-preparer',
    actorRole: 'PREPARER',
    action: 'MAPPING_UPDATED',
    entityType: 'MAPPING',
    entityId: mapping?.id ?? ledger.id,
    reason: `Changed mapping from ${mapping?.taxonomyCode ?? 'unmapped'} to ${taxonomyCode} in demo workspace.`
  });
  await db.transaction('rw', db.mappings, db.auditEvents, async () => {
    const values = {
      taxonomyCode,
      status: 'DRAFT' as const,
      currentNonCurrent: node.currentNonCurrent,
      cashFlowClass: node.cashFlowClass,
      suggestionConfidence: 0,
      suggestionReason: 'User-edited mapping awaiting reviewer approval.',
      reviewedBy: undefined,
      reviewedAt: undefined,
      updatedAt: new Date().toISOString()
    };
    if (mapping) {
      await db.mappings.update(mapping.id, values);
    } else {
      await db.mappings.add({
        id: crypto.randomUUID(),
        companyId: ledger.companyId,
        periodId: ledger.periodId,
        ledgerId: ledger.id,
        ...values
      });
    }
    await db.auditEvents.add(event);
  });
}

export async function resolveValidation(validationId: string, resolution: string): Promise<void> {
  const validation = await db.validations.get(validationId);
  if (!validation) throw new Error('Validation result was not found.');
  const event = await nextAuditEvent({
    companyId: validation.companyId,
    periodId: validation.periodId,
    actorId: 'demo-reviewer',
    actorRole: 'REVIEWER',
    action: 'VALIDATION_RESOLVED',
    entityType: 'VALIDATION',
    entityId: validation.id,
    reason: resolution
  });
  await db.transaction('rw', db.validations, db.auditEvents, async () => {
    await db.validations.update(validation.id, {
      status: 'RESOLVED',
      resolution,
      resolvedBy: 'demo-reviewer',
      resolvedAt: new Date().toISOString()
    });
    await db.auditEvents.add(event);
  });
}

export async function reviewAdjustment(adjustmentId: string, approve: boolean): Promise<void> {
  const adjustment = await db.adjustments.get(adjustmentId);
  if (!adjustment) throw new Error('Adjustment was not found.');
  const lines = await db.adjustmentLines.where('adjustmentId').equals(adjustmentId).toArray();
  const debit = lines.reduce((total, line) => total + line.debitPaise, 0);
  const credit = lines.reduce((total, line) => total + line.creditPaise, 0);
  if (approve && debit !== credit) throw new Error('An unbalanced adjustment cannot be posted.');
  const now = new Date().toISOString();
  const status = approve ? 'POSTED' : 'REJECTED';
  const event = await nextAuditEvent({
    companyId: adjustment.companyId,
    periodId: adjustment.periodId,
    actorId: 'demo-reviewer',
    actorRole: 'REVIEWER',
    action: approve ? 'ADJUSTMENT_POSTED' : 'ADJUSTMENT_REJECTED',
    entityType: 'ADJUSTMENT',
    entityId: adjustment.id,
    reason: approve ? 'Reviewed and posted in the interactive demo.' : 'Rejected in the interactive demo.'
  });
  await db.transaction('rw', db.adjustments, db.auditEvents, async () => {
    await db.adjustments.update(adjustment.id, {
      status,
      reviewedBy: 'demo-reviewer',
      reviewedAt: now,
      reviewComment: approve ? 'Reviewed and approved in demo mode.' : 'Rejected in demo mode.',
      postedAt: approve ? now : undefined
    });
    await db.auditEvents.add(event);
  });
}

export async function createSubmittedAdjustment(input: {
  companyId: string;
  periodId: string;
  referenceNumber: string;
  type: Adjustment['type'];
  entryDate: string;
  narration: string;
  workpaperReference: string;
  debitLedgerId: string;
  creditLedgerId: string;
  amountPaise: number;
}): Promise<void> {
  if (!input.referenceNumber.trim() || !input.narration.trim() || !input.workpaperReference.trim()) {
    throw new Error('Reference, narration, and workpaper reference are mandatory.');
  }
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) throw new Error('Amount must be greater than zero.');
  if (input.debitLedgerId === input.creditLedgerId) throw new Error('Debit and credit ledgers must be different.');
  const [debitLedger, creditLedger, existing] = await Promise.all([
    db.ledgers.get(input.debitLedgerId),
    db.ledgers.get(input.creditLedgerId),
    db.adjustments.where('referenceNumber').equals(input.referenceNumber.trim()).first()
  ]);
  if (!debitLedger || !creditLedger) throw new Error('Selected ledger was not found.');
  if (debitLedger.periodId !== input.periodId || creditLedger.periodId !== input.periodId) throw new Error('Ledgers must belong to the selected period.');
  if (existing) throw new Error('Adjustment reference number already exists.');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const adjustment: Adjustment = {
    id,
    companyId: input.companyId,
    periodId: input.periodId,
    referenceNumber: input.referenceNumber.trim(),
    type: input.type,
    entryDate: input.entryDate,
    narration: input.narration.trim(),
    workpaperReference: input.workpaperReference.trim(),
    status: 'SUBMITTED',
    preparedBy: 'demo-preparer',
    preparedAt: now
  };
  const lines: AdjustmentLine[] = [
    { id: crypto.randomUUID(), adjustmentId: id, ledgerId: input.debitLedgerId, lineNumber: 1, debitPaise: input.amountPaise, creditPaise: 0, description: input.narration.trim() },
    { id: crypto.randomUUID(), adjustmentId: id, ledgerId: input.creditLedgerId, lineNumber: 2, debitPaise: 0, creditPaise: input.amountPaise, description: input.narration.trim() }
  ];
  const event = await nextAuditEvent({
    companyId: input.companyId,
    periodId: input.periodId,
    actorId: 'demo-preparer',
    actorRole: 'PREPARER',
    action: 'ADJUSTMENT_SUBMITTED',
    entityType: 'ADJUSTMENT',
    entityId: id,
    reason: input.narration.trim()
  });
  await db.transaction('rw', db.adjustments, db.adjustmentLines, db.auditEvents, async () => {
    await db.adjustments.add(adjustment);
    await db.adjustmentLines.bulkAdd(lines);
    await db.auditEvents.add(event);
  });
}

export async function updateNoteDisclosure(
  noteId: string,
  changes: Pick<NoteDisclosure, 'status' | 'narrative'>
): Promise<void> {
  const note = await db.notes.get(noteId);
  if (!note) throw new Error('Disclosure note was not found.');
  const event = await nextAuditEvent({
    companyId: note.companyId,
    periodId: note.periodId,
    actorId: 'demo-preparer',
    actorRole: 'PREPARER',
    action: 'NOTE_UPDATED',
    entityType: 'NOTE',
    entityId: note.id,
    reason: `Updated Note ${note.noteNumber} and set status to ${changes.status}.`
  });
  await db.transaction('rw', db.notes, db.auditEvents, async () => {
    await db.notes.update(noteId, { ...changes, updatedAt: new Date().toISOString() });
    await db.auditEvents.add(event);
  });
}

export async function finalisePeriod(periodId: string, openIssueCount: number): Promise<void> {
  const period = await db.periods.get(periodId);
  if (!period) throw new Error('Reporting period was not found.');
  if (period.status === 'FINALISED') return;
  if (openIssueCount > 0) throw new Error('All open review issues must be resolved or accepted before finalisation.');
  const ledgers = await db.ledgers.where('importId').equals(period.activeImportId).toArray();
  const mappings = await db.mappings.where('periodId').equals(periodId).toArray();
  const mappingByLedger = new Map(mappings.map((mapping) => [mapping.ledgerId, mapping]));
  if (ledgers.some((ledger) => mappingByLedger.get(ledger.id)?.status !== 'LOCKED')) {
    throw new Error('Every active ledger mapping must be locked before finalisation.');
  }
  const submitted = await db.adjustments.where('periodId').equals(periodId).filter((item) => item.status === 'SUBMITTED').count();
  if (submitted > 0) throw new Error('Submitted adjustments must be posted or rejected before finalisation.');
  const pendingNotes = await db.notes.where('periodId').equals(periodId).filter((item) => item.status === 'PENDING').count();
  if (pendingNotes > 0) throw new Error('Pending disclosure notes must be completed or marked not applicable.');
  const event = await nextAuditEvent({
    companyId: period.companyId,
    periodId,
    actorId: 'demo-reviewer',
    actorRole: 'REVIEWER',
    action: 'PERIOD_FINALISED',
    entityType: 'REPORTING_PERIOD',
    entityId: periodId,
    reason: 'All configured preparation and review gates completed.'
  });
  await db.transaction('rw', db.periods, db.auditEvents, async () => {
    await db.periods.update(periodId, { status: 'FINALISED', updatedAt: new Date().toISOString() });
    await db.auditEvents.add(event);
  });
}

export async function resetDemoData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.companies,
      db.periods,
      db.imports,
      db.ledgers,
      db.mappings,
      db.adjustments,
      db.adjustmentLines,
      db.validations,
      db.notes,
      db.auditEvents,
      db.users
    ],
    async () => {
      const adjustmentIds = (await db.adjustments.where('periodId').equals(demoPeriod.id).primaryKeys()) as string[];
      for (const adjustmentId of adjustmentIds) {
        await db.adjustmentLines.where('adjustmentId').equals(adjustmentId).delete();
      }
      await Promise.all([
        db.ledgers.where('periodId').equals(demoPeriod.id).delete(),
        db.mappings.where('periodId').equals(demoPeriod.id).delete(),
        db.adjustments.where('periodId').equals(demoPeriod.id).delete(),
        db.validations.where('periodId').equals(demoPeriod.id).delete(),
        db.notes.where('periodId').equals(demoPeriod.id).delete(),
        db.auditEvents.where('periodId').equals(demoPeriod.id).delete(),
        db.imports.where('periodId').equals(demoPeriod.id).delete(),
        db.periods.delete(demoPeriod.id),
        db.companies.delete(demoCompany.id)
      ]);
      for (const user of demoUsers) await db.users.delete(user.id);
    }
  );
  await initializeDatabase();
}

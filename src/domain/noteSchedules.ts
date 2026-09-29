import { divisionIDisclosureGuidance } from '../data/noteTemplates';
import { taxonomyByCode } from '../data/taxonomy';
import type { FinancialStatements, Money, NoteDisclosure, ReportLine, WorkspaceData } from './types';

export interface NoteScheduleRow {
  key: string;
  label: string;
  currentPaise: Money;
  comparativePaise: Money;
}

export interface NoteMovementRow {
  label: string;
  amountPaise: Money;
  emphasis?: boolean;
}

export interface NoteSchedule {
  rows: NoteScheduleRow[];
  totalCurrentPaise: Money;
  totalComparativePaise: Money;
  movementRows?: NoteMovementRow[];
  movementScope?: string;
  completionRequirement?: string;
}

function postedAdjustmentEffects(workspace: WorkspaceData): Map<string, Money> {
  const postedIds = new Set(
    workspace.adjustments.filter((adjustment) => adjustment.status === 'POSTED').map((adjustment) => adjustment.id)
  );
  const effects = new Map<string, Money>();
  for (const line of workspace.adjustmentLines) {
    if (!postedIds.has(line.adjustmentId)) continue;
    effects.set(line.ledgerId, (effects.get(line.ledgerId) ?? 0) + line.debitPaise - line.creditPaise);
  }
  return effects;
}

function statementLinesByCode(statements: FinancialStatements): Map<string, ReportLine> {
  return new Map(
    [...statements.balanceSheet, ...statements.profitAndLoss, ...statements.cashFlow].map((line) => [line.code, line])
  );
}

export function buildNoteSchedule(
  note: NoteDisclosure,
  workspace: WorkspaceData,
  statements: FinancialStatements
): NoteSchedule {
  const noteCodes = new Set(note.taxonomyCodes);
  const ledgerById = new Map(workspace.ledgers.map((ledger) => [ledger.id, ledger]));
  const adjustmentEffects = postedAdjustmentEffects(workspace);
  const rows: NoteScheduleRow[] = [];

  for (const mapping of workspace.mappings) {
    if (!noteCodes.has(mapping.taxonomyCode)) continue;
    const ledger = ledgerById.get(mapping.ledgerId);
    const node = taxonomyByCode.get(mapping.taxonomyCode);
    if (!ledger || !node) continue;
    const presentationSign = node.normalBalance === 'CREDIT' ? -1 : 1;
    rows.push({
      key: `${mapping.taxonomyCode}:${ledger.id}`,
      label: ledger.name,
      currentPaise: (ledger.signedCurrentPaise + (adjustmentEffects.get(ledger.id) ?? 0)) * presentationSign,
      comparativePaise: ledger.signedComparativePaise * presentationSign
    });
  }

  rows.sort((left, right) => left.label.localeCompare(right.label, 'en-IN', { sensitivity: 'base' }));

  if (rows.length === 0 && note.taxonomyCodes.length > 0) {
    const reportLines = statementLinesByCode(statements);
    for (const code of note.taxonomyCodes) {
      const line = reportLines.get(code);
      if (!line) continue;
      rows.push({
        key: code,
        label: line.label,
        currentPaise: line.currentPaise,
        comparativePaise: line.comparativePaise
      });
    }
  }

  const totalCurrentPaise = rows.reduce((total, row) => total + row.currentPaise, 0);
  const totalComparativePaise = rows.reduce((total, row) => total + row.comparativePaise, 0);
  const isFixedAssetNote = note.noteNumber === '3' || note.noteNumber === '4';

  return {
    rows,
    totalCurrentPaise,
    totalComparativePaise,
    movementRows: isFixedAssetNote
      ? [
          { label: 'Opening net carrying amount', amountPaise: totalComparativePaise },
          { label: 'Net movement represented in the mapped Trial Balance', amountPaise: totalCurrentPaise - totalComparativePaise },
          { label: 'Closing net carrying amount', amountPaise: totalCurrentPaise, emphasis: true }
        ]
      : undefined,
    movementScope: isFixedAssetNote
      ? 'This bridge reconciles net carrying amounts available from the mapped Trial Balance. Complete the gross-block and accumulated depreciation/amortisation movement schedule from the fixed-asset register before finalisation.'
      : undefined,
    completionRequirement: divisionIDisclosureGuidance[note.noteNumber]
  };
}

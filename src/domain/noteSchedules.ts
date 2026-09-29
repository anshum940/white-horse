import { divisionIDisclosureGuidance } from '../data/noteTemplates';
import { taxonomyByCode } from '../data/taxonomy';
import { formatMoney, variancePercent } from './money';
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
  automaticDisclosure: {
    status: 'GENERATED' | 'NO_BALANCE' | 'REQUIRES_WORKPAPER';
    paragraphs: string[];
  };
}

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function scaleLabel(scale: WorkspaceData['company']['displayScale']): string {
  return { RUPEES: 'rupees', THOUSANDS: 'thousands', LAKHS: 'lakhs', CRORES: 'crores' }[scale];
}

function automaticDisclosure(
  note: NoteDisclosure,
  workspace: WorkspaceData,
  rowCount: number,
  totalCurrentPaise: Money,
  totalComparativePaise: Money
): NoteSchedule['automaticDisclosure'] {
  const amount = (value: Money) => `${formatMoney(value, workspace.company.displayScale, { currencySymbol: true })} ${scaleLabel(workspace.company.displayScale)}`;
  const currentDate = dateLabel(workspace.period.endDate);
  const comparativeDate = dateLabel(workspace.period.comparativeEndDate);

  if (note.noteNumber === '1') {
    return {
      status: 'GENERATED',
      paragraphs: [
        `${workspace.company.legalName} (CIN ${workspace.company.cin}) maintains its registered office at ${workspace.company.registeredOffice}. The workspace records its principal industry as ${workspace.company.industry}.`,
        `These standalone financial statements cover ${workspace.period.label}, ended ${currentDate}, with comparative information for ${workspace.period.comparativeLabel}, ended ${comparativeDate}.`
      ]
    };
  }

  if (note.noteNumber === '2') {
    return {
      status: 'GENERATED',
      paragraphs: [
        `The statements are prepared in Indian rupees using the configured Schedule III Division I-oriented taxonomy ${workspace.period.taxonomyVersion}. Amounts are presented in ${scaleLabel(workspace.company.displayScale)} while source values remain stored in paise.`,
        `The automated schedules use the active Trial Balance “${workspace.activeImport.fileName}”, reviewed mappings and posted adjustments. Entity-specific accounting policies, estimates, going-concern assessment and applicable Accounting Standard conclusions require preparer and reviewer approval.`
      ]
    };
  }

  if (note.noteNumber === '29') {
    return {
      status: 'REQUIRES_WORKPAPER',
      paragraphs: [
        `White Horse calculates the analytical ratio schedule from the mapped current and comparative statements. Missing denominators or unavailable principal-repayment information are reported as N/A rather than zero.`,
        `Management explanations for material movements must be supported by the company’s operating facts and approved workpapers before this note is completed.`
      ]
    };
  }

  if (note.noteNumber === '30') {
    return {
      status: 'REQUIRES_WORKPAPER',
      paragraphs: [
        `The active Trial Balance does not establish non-ledger regulatory facts such as title-deed exceptions, benami proceedings, wilful-defaulter status, struck-off-company relationships, charge registration, schemes, fund-routing arrangements, CSR obligations or virtual-currency activity.`,
        `Assess every applicable Schedule III regulatory disclosure for ${workspace.company.legalName} using statutory registers, legal confirmations, tax records and governance workpapers.`
      ]
    };
  }

  if (rowCount === 0 || (totalCurrentPaise === 0 && totalComparativePaise === 0)) {
    return {
      status: 'NO_BALANCE',
      paragraphs: [
        `No mapped Trial Balance amount is presented under ${note.title.toLowerCase()} at ${currentDate} or ${comparativeDate}.`,
        `A nil ledger balance does not by itself make the disclosure inapplicable. Confirm off-balance-sheet, ageing, commitment, movement and regulatory requirements before marking this note Not applicable.`
      ]
    };
  }

  const movement = totalCurrentPaise - totalComparativePaise;
  const variance = variancePercent(totalCurrentPaise, totalComparativePaise);
  const movementDescription = totalComparativePaise === 0
    ? `The current-period balance is new relative to the mapped comparative balance.`
    : `${note.title} ${movement >= 0 ? 'increased' : 'decreased'} by ${amount(Math.abs(movement))} (${Math.abs(variance ?? 0).toFixed(1)}%) from the comparative period.`;

  return {
    status: 'GENERATED',
    paragraphs: [
      `Based on ${rowCount} mapped ledger${rowCount === 1 ? '' : 's'} and posted adjustments, ${note.title.toLowerCase()} is ${amount(totalCurrentPaise)} at ${currentDate}, compared with ${amount(totalComparativePaise)} at ${comparativeDate}.`,
      movementDescription
    ]
  };
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
    completionRequirement: divisionIDisclosureGuidance[note.noteNumber],
    automaticDisclosure: automaticDisclosure(note, workspace, rows.length, totalCurrentPaise, totalComparativePaise)
  };
}

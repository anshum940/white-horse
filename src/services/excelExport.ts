import type { Cell, CellObject, SheetData, Value } from 'write-excel-file/browser';
import { taxonomyByCode } from '../data/taxonomy';
import { hasComparativeCashFlowSummary } from '../domain/cashFlowAvailability';
import { calculateRatioSchedule } from '../domain/ratios';
import type { FinancialStatements, KpiSet, ValidationResult, WorkspaceData } from '../domain/types';

const headerStyle: Partial<CellObject> = { fontWeight: 'bold', backgroundColor: '#DCE8E3', textColor: '#163E3B', align: 'center' };
const titleStyle: Partial<CellObject> = { fontWeight: 'bold', fontSize: 15, textColor: '#163E3B' };
const moneyFormat = '#,##0.00;[Red](#,##0.00);-';

const cell = (value: Value, style: Partial<CellObject> = {}): Cell => ({ value, ...style });
const moneyCell = (paise: number, style: Partial<CellObject> = {}): Cell => cell(paise / 100, { format: moneyFormat, align: 'right', ...style });
const ratioCell = (value: number | null): Cell => value === null ? cell('N/A') : cell(value, { format: '0.0000', align: 'right' });

function statementSheet(title: string, lines: FinancialStatements['balanceSheet'], workspace: WorkspaceData, comparativeUnavailable = false): SheetData {
  const rows: SheetData = [
    [cell(workspace.company.legalName, titleStyle)],
    [cell(title, { ...titleStyle, fontSize: 13 })],
    [cell(comparativeUnavailable
      ? `Schedule III Division I · ${workspace.period.label} · amounts in INR · comparative cash-flow details not supplied`
      : `Schedule III Division I · ${workspace.period.label} · amounts in INR`, { textColor: '#6D7774' })],
    [cell('Particulars', headerStyle), cell('Note', headerStyle), cell(workspace.period.label, headerStyle), cell(workspace.period.comparativeLabel, headerStyle)]
  ];
  for (const line of lines) {
    const isStrong = line.kind === 'TOTAL' || line.kind === 'CALCULATED' || line.kind === 'SECTION';
    rows.push([
      cell(line.label, { fontWeight: isStrong ? 'bold' : undefined, backgroundColor: line.kind === 'SECTION' ? '#F2F0E9' : undefined, indent: line.depth }),
      cell(line.noteNumber ?? '', { align: 'center' }),
      moneyCell(line.currentPaise, { fontWeight: isStrong ? 'bold' : undefined }),
      comparativeUnavailable ? cell('Not supplied', { textColor: '#755622' }) : moneyCell(line.comparativePaise, { fontWeight: isStrong ? 'bold' : undefined })
    ]);
  }
  return rows;
}

export async function exportFinancialWorkbook(
  workspace: WorkspaceData,
  statements: FinancialStatements,
  kpis: KpiSet,
  validations: ValidationResult[]
): Promise<void> {
  if (!workspace.ledgers.length) throw new Error('Import and activate a Trial Balance before generating financial statements.');
  const mappedLedgerIds = new Set(workspace.mappings.filter((mapping) => mapping.taxonomyCode).map((mapping) => mapping.ledgerId));
  const unmappedCount = workspace.ledgers.filter((ledger) => !mappedLedgerIds.has(ledger.id)).length;
  if (unmappedCount > 0) throw new Error(`${unmappedCount} active ledger${unmappedCount === 1 ? ' is' : 's are'} unmapped. Complete mapping before generating the full pack.`);
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const cover: SheetData = [
    [cell('WHITE HORSE — COMPLETE FINANCIAL STATEMENT PACK', { ...titleStyle, fontSize: 16 })],
    [cell(workspace.company.legalName, titleStyle)],
    [cell('Trade name'), cell(workspace.company.tradeName)],
    [cell('CIN'), cell(workspace.company.cin)],
    [cell('Registered office'), cell(workspace.company.registeredOffice)],
    [cell('Industry'), cell(workspace.company.industry)],
    [cell('Reporting period'), cell(`${workspace.period.label}: ${workspace.period.startDate} to ${workspace.period.endDate}`)],
    [cell('Comparative period'), cell(`${workspace.period.comparativeLabel}: ${workspace.period.comparativeStartDate} to ${workspace.period.comparativeEndDate}`)],
    [cell('Framework'), cell('Schedule III Division I — standalone non-Ind AS commercial/industrial company')],
    [cell('Taxonomy / ruleset'), cell(`${workspace.period.taxonomyVersion} / ${workspace.period.rulesetVersion}`)],
    [cell('Period status'), cell(workspace.period.status.replaceAll('_', ' '))],
    [cell('Generated'), cell(new Date().toISOString())],
    [],
    [cell('Professional-use warning', { fontWeight: 'bold', textColor: '#A53B36' })],
    [cell('This workbook automates presentation and reconciliation from the configured data. The preparer and reviewer must complete all applicable accounting-standard, Companies Act, Schedule III, sector-specific and entity-specific disclosures before statutory use.')]
  ];
  const tb: SheetData = [
    [cell('Ledger code', headerStyle), cell('Ledger name', headerStyle), cell('Group', headerStyle), cell('Closing debit', headerStyle), cell('Closing credit', headerStyle), cell('Comparative signed', headerStyle)]
  ];
  for (const ledger of workspace.ledgers) {
    tb.push([cell(ledger.code), cell(ledger.name), cell(`${ledger.group} / ${ledger.subGroup}`), moneyCell(ledger.closingDebitPaise), moneyCell(ledger.closingCreditPaise), moneyCell(ledger.signedComparativePaise)]);
  }

  const mappingByLedger = new Map(workspace.mappings.map((mapping) => [mapping.ledgerId, mapping]));
  const mapping: SheetData = [[cell('Ledger code', headerStyle), cell('Ledger name', headerStyle), cell('Taxonomy code', headerStyle), cell('Statement head', headerStyle), cell('Status', headerStyle), cell('Cash-flow class', headerStyle)]];
  for (const ledger of workspace.ledgers) {
    const mapped = mappingByLedger.get(ledger.id);
    const node = mapped ? taxonomyByCode.get(mapped.taxonomyCode) : undefined;
    mapping.push([cell(ledger.code), cell(ledger.name), cell(mapped?.taxonomyCode ?? ''), cell(node?.label ?? 'UNMAPPED'), cell(mapped?.status ?? 'UNMAPPED'), cell(mapped?.cashFlowClass ?? '')]);
  }

  const adjustments: SheetData = [[cell('Reference', headerStyle), cell('Date', headerStyle), cell('Type', headerStyle), cell('Narration', headerStyle), cell('Workpaper', headerStyle), cell('Status', headerStyle), cell('Debit total', headerStyle), cell('Credit total', headerStyle)]];
  for (const adjustment of workspace.adjustments) {
    const lines = workspace.adjustmentLines.filter((line) => line.adjustmentId === adjustment.id);
    adjustments.push([cell(adjustment.referenceNumber), cell(adjustment.entryDate), cell(adjustment.type), cell(adjustment.narration), cell(adjustment.workpaperReference), cell(adjustment.status), moneyCell(lines.reduce((sum, line) => sum + line.debitPaise, 0)), moneyCell(lines.reduce((sum, line) => sum + line.creditPaise, 0))]);
  }

  const review: SheetData = [[cell('Rule', headerStyle), cell('Severity', headerStyle), cell('Status', headerStyle), cell('Title', headerStyle), cell('Evidence', headerStyle), cell('Suggested action', headerStyle), cell('Resolution', headerStyle)]];
  for (const result of validations) review.push([cell(result.ruleId), cell(result.severity), cell(result.status), cell(result.title), cell(result.evidence), cell(result.suggestedAction), cell(result.resolution ?? '')]);

  const ratioRows = calculateRatioSchedule(statements, kpis);
  const ratios: SheetData = [[cell('Ratio', headerStyle), cell('Formula', headerStyle), cell(workspace.period.label, headerStyle), cell(workspace.period.comparativeLabel, headerStyle), cell('Unit', headerStyle), cell('Benchmark / review basis', headerStyle), cell('Status', headerStyle)]];
  for (const row of ratioRows) ratios.push([
    cell(row.name),
    cell(row.formula),
    ratioCell(row.current),
    ratioCell(row.comparative),
    cell(row.format === '%' ? 'Decimal (format as %)' : 'Times'),
    cell(row.benchmark),
    cell(row.withinRange === null ? 'INPUT REQUIRED / N/A' : row.withinRange ? 'WITHIN ILLUSTRATIVE RANGE' : 'REVIEW')
  ]);

  const statementLineByCode = new Map([...statements.balanceSheet, ...statements.profitAndLoss].map((line) => [line.code, line]));
  const notes: SheetData = [[cell('Note', headerStyle), cell('Title', headerStyle), cell('Mapped statement heads', headerStyle), cell(workspace.period.label, headerStyle), cell(workspace.period.comparativeLabel, headerStyle), cell('Status', headerStyle), cell('Owner', headerStyle), cell('Narrative / disclosure workpaper', headerStyle)]];
  for (const note of [...workspace.notes].sort((left, right) => Number(left.noteNumber) - Number(right.noteNumber))) {
    const lines = note.taxonomyCodes.map((code) => statementLineByCode.get(code)).filter((line) => line !== undefined);
    const current = lines.reduce((total, line) => total + line.currentPaise, 0);
    const comparative = lines.reduce((total, line) => total + line.comparativePaise, 0);
    notes.push([
      cell(note.noteNumber),
      cell(note.title),
      cell(note.taxonomyCodes.join(', ')),
      note.taxonomyCodes.length ? moneyCell(current) : cell(''),
      note.taxonomyCodes.length ? moneyCell(comparative) : cell(''),
      cell(note.status.replaceAll('_', ' ')),
      cell(note.owner),
      cell(note.narrative)
    ]);
  }

  const audit: SheetData = [[cell('Sequence', headerStyle), cell('Timestamp', headerStyle), cell('Actor', headerStyle), cell('Role', headerStyle), cell('Action', headerStyle), cell('Entity type', headerStyle), cell('Entity ID', headerStyle), cell('Reason', headerStyle), cell('Event hash', headerStyle)]];
  for (const event of workspace.auditEvents) audit.push([cell(event.sequence), cell(event.timestamp), cell(event.actorId), cell(event.actorRole), cell(event.action), cell(event.entityType), cell(event.entityId), cell(event.reason), cell(event.eventHash)]);

  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  await writeXlsxFile([
    { sheet: 'Cover', data: cover, columns: [{ width: 34 }, { width: 90 }], stickyRowsCount: 2 },
    { sheet: 'Balance Sheet', data: statementSheet('Balance Sheet', statements.balanceSheet, workspace), columns: [{ width: 42 }, { width: 10 }, { width: 18 }, { width: 18 }], stickyRowsCount: 4 },
    { sheet: 'Profit and Loss', data: statementSheet('Statement of Profit and Loss', statements.profitAndLoss, workspace), columns: [{ width: 42 }, { width: 10 }, { width: 18 }, { width: 18 }], stickyRowsCount: 4 },
    { sheet: 'Cash Flow', data: statementSheet('Cash Flow Statement', statements.cashFlow, workspace, !hasComparativeCashFlowSummary(workspace.period)), columns: [{ width: 48 }, { width: 10 }, { width: 18 }, { width: 18 }], stickyRowsCount: 4 },
    { sheet: 'Notes to Accounts', data: notes, columns: [{ width: 9 }, { width: 34 }, { width: 34 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 90 }], stickyRowsCount: 1 },
    { sheet: 'Ratios', data: ratios, columns: [{ width: 34 }, { width: 50 }, { width: 18 }, { width: 18 }, { width: 22 }, { width: 38 }, { width: 28 }], stickyRowsCount: 1 },
    { sheet: 'Trial Balance', data: tb, columns: [{ width: 15 }, { width: 42 }, { width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Mapping', data: mapping, columns: [{ width: 15 }, { width: 42 }, { width: 23 }, { width: 38 }, { width: 14 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Adjustments', data: adjustments, columns: [{ width: 16 }, { width: 14 }, { width: 18 }, { width: 50 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Validation', data: review, columns: [{ width: 14 }, { width: 14 }, { width: 14 }, { width: 35 }, { width: 50 }, { width: 50 }, { width: 50 }], stickyRowsCount: 1 },
    { sheet: 'Audit Trail', data: audit, columns: [{ width: 12 }, { width: 25 }, { width: 20 }, { width: 14 }, { width: 30 }, { width: 22 }, { width: 38 }, { width: 70 }, { width: 68 }], stickyRowsCount: 1 }
  ]).toFile(`WhiteHorse_${workspace.company.tradeName.replace(/[^a-z0-9]+/gi, '_')}_${workspace.period.endDate}_${stamp}.xlsx`);
}

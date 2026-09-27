import type { Cell, CellObject, SheetData, Value } from 'write-excel-file/browser';
import { taxonomyByCode } from '../data/taxonomy';
import type { FinancialStatements, KpiSet, ValidationResult, WorkspaceData } from '../domain/types';

const headerStyle: Partial<CellObject> = { fontWeight: 'bold', backgroundColor: '#DCE8E3', textColor: '#163E3B', align: 'center' };
const titleStyle: Partial<CellObject> = { fontWeight: 'bold', fontSize: 15, textColor: '#163E3B' };
const moneyFormat = '#,##0.00;[Red](#,##0.00);-';

const cell = (value: Value, style: Partial<CellObject> = {}): Cell => ({ value, ...style });
const moneyCell = (paise: number, style: Partial<CellObject> = {}): Cell => cell(paise / 100, { format: moneyFormat, align: 'right', ...style });

function statementSheet(title: string, lines: FinancialStatements['balanceSheet'], workspace: WorkspaceData): SheetData {
  const rows: SheetData = [
    [cell(workspace.company.legalName, titleStyle)],
    [cell(title, { ...titleStyle, fontSize: 13 })],
    [cell('Particulars', headerStyle), cell('Note', headerStyle), cell(workspace.period.label, headerStyle), cell(workspace.period.comparativeLabel, headerStyle)]
  ];
  for (const line of lines) {
    const isStrong = line.kind === 'TOTAL' || line.kind === 'CALCULATED' || line.kind === 'SECTION';
    rows.push([
      cell(line.label, { fontWeight: isStrong ? 'bold' : undefined, backgroundColor: line.kind === 'SECTION' ? '#F2F0E9' : undefined, indent: line.depth }),
      cell(line.noteNumber ?? '', { align: 'center' }),
      moneyCell(line.currentPaise, { fontWeight: isStrong ? 'bold' : undefined }),
      moneyCell(line.comparativePaise, { fontWeight: isStrong ? 'bold' : undefined })
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
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
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

  const ratioRows: Array<[string, number | null, number | null]> = [
    ['Current ratio', kpis.currentRatio, kpis.comparativeCurrentRatio],
    ['Debt–equity ratio', kpis.debtEquityRatio, kpis.comparativeDebtEquityRatio],
    ['Interest coverage', kpis.interestCoverage, kpis.comparativeInterestCoverage],
    ['Return on equity', kpis.roe, kpis.comparativeRoe],
    ['Return on capital employed', kpis.roce, kpis.comparativeRoce]
  ];
  const ratios: SheetData = [[cell('Ratio', headerStyle), cell(workspace.period.label, headerStyle), cell(workspace.period.comparativeLabel, headerStyle)]];
  for (const [label, current, prior] of ratioRows) ratios.push([cell(label), cell(current ?? 'N/A', { format: '0.00' }), cell(prior ?? 'N/A', { format: '0.00' })]);

  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  await writeXlsxFile([
    { sheet: 'Balance Sheet', data: statementSheet('Balance Sheet', statements.balanceSheet, workspace), columns: [{ width: 42 }, { width: 10 }, { width: 18 }, { width: 18 }], stickyRowsCount: 3 },
    { sheet: 'Profit and Loss', data: statementSheet('Statement of Profit and Loss', statements.profitAndLoss, workspace), columns: [{ width: 42 }, { width: 10 }, { width: 18 }, { width: 18 }], stickyRowsCount: 3 },
    { sheet: 'Cash Flow', data: statementSheet('Cash Flow Statement', statements.cashFlow, workspace), columns: [{ width: 48 }, { width: 10 }, { width: 18 }, { width: 18 }], stickyRowsCount: 3 },
    { sheet: 'Trial Balance', data: tb, columns: [{ width: 15 }, { width: 42 }, { width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Mapping', data: mapping, columns: [{ width: 15 }, { width: 42 }, { width: 23 }, { width: 38 }, { width: 14 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Adjustments', data: adjustments, columns: [{ width: 16 }, { width: 14 }, { width: 18 }, { width: 50 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Ratios', data: ratios, columns: [{ width: 34 }, { width: 18 }, { width: 18 }], stickyRowsCount: 1 },
    { sheet: 'Validation', data: review, columns: [{ width: 14 }, { width: 14 }, { width: 14 }, { width: 35 }, { width: 50 }, { width: 50 }, { width: 50 }], stickyRowsCount: 1 }
  ]).toFile(`WhiteHorse_${workspace.company.tradeName.replace(/[^a-z0-9]+/gi, '_')}_${workspace.period.endDate}_${stamp}.xlsx`);
}

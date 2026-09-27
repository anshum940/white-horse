import type { Cell, CellObject, SheetData, Value } from 'write-excel-file/browser';

export interface TrialBalanceTemplateColumn {
  name: string;
  requirement: 'Required' | 'Recommended';
  rule: string;
}

export const trialBalanceTemplateColumns: TrialBalanceTemplateColumn[] = [
  { name: 'Ledger Code', requirement: 'Required', rule: 'Unique text/code for every ledger; duplicates are rejected.' },
  { name: 'Ledger Name', requirement: 'Required', rule: 'Plain-text ledger name used for mapping suggestions and reports.' },
  { name: 'Group', requirement: 'Recommended', rule: 'Source-system group, for example Assets, Liabilities, Income or Expenses.' },
  { name: 'Subgroup', requirement: 'Recommended', rule: 'More specific source classification such as Cash, Inventory or Revenue.' },
  { name: 'Closing Debit', requirement: 'Required', rule: 'Positive INR amount or zero; do not use lakhs or a signed balance.' },
  { name: 'Closing Credit', requirement: 'Required', rule: 'Positive INR amount or zero; only one closing side may be non-zero per row.' },
  { name: 'Previous Debit', requirement: 'Recommended', rule: 'Prior-year closing debit in INR for comparative statements.' },
  { name: 'Previous Credit', requirement: 'Recommended', rule: 'Prior-year closing credit in INR for comparative statements.' }
];

const headers = trialBalanceTemplateColumns.map((column) => column.name);
const examples: Array<Array<string | number>> = [
  ['EXAMPLE-DR', 'Example bank balance — replace this row', 'Assets', 'Cash and bank', 100000, 0, 75000, 0],
  ['EXAMPLE-CR', 'Example equity balance — replace this row', 'Equity', 'Share capital', 0, 100000, 0, 75000]
];

function quote(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function buildTrialBalanceTemplateCsv(): string {
  return `\uFEFF${[headers, ...examples].map((row) => row.map(quote).join(',')).join('\r\n')}\r\n`;
}

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadTrialBalanceTemplateCsv(): void {
  download(new Blob([buildTrialBalanceTemplateCsv()], { type: 'text/csv;charset=utf-8' }), 'White_Horse_Trial_Balance_Template.csv');
}

export async function downloadTrialBalanceTemplateXlsx(): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const headerStyle: Partial<CellObject> = { fontWeight: 'bold', backgroundColor: '#DCE8E3', textColor: '#163E3B' };
  const cell = (value: Value, style: Partial<CellObject> = {}): Cell => ({ value, ...style });
  const data: SheetData = [
    headers.map((value) => cell(value, headerStyle)),
    ...examples.map((row) => row.map((value) => cell(value))),
    [cell('Replace both example rows with the complete company Trial Balance. Amounts must be positive INR values; total closing debits must equal total closing credits.', { fontWeight: 'bold', textColor: '#A53B36' })]
  ];
  await writeXlsxFile([
    {
      sheet: 'Trial Balance',
      data,
      columns: [{ width: 18 }, { width: 44 }, { width: 20 }, { width: 24 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }],
      stickyRowsCount: 1
    }
  ]).toFile('White_Horse_Trial_Balance_Template.xlsx');
}

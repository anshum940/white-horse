export interface TrialBalanceTemplateColumn {
  name: string;
  requirement: 'Required' | 'Recommended';
  rule: string;
}

export const trialBalanceTemplateVersion = 'WH-TB-1.0';

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

export const trialBalanceTemplateHeaders = trialBalanceTemplateColumns.map((column) => column.name);

function quote(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function buildTrialBalanceTemplateCsv(): string {
  return `\uFEFF${trialBalanceTemplateHeaders.map(quote).join(',')}\r\n`;
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
  download(new Blob([buildTrialBalanceTemplateCsv()], { type: 'text/csv;charset=utf-8' }), 'White_Horse_Standard_TB_Import.csv');
}

export async function downloadTrialBalanceTemplateXlsx(): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/White_Horse_Standard_TB_Import.xlsx`);
  if (!response.ok) throw new Error('The Standard TB XLSX template could not be loaded. Try the CSV template or refresh the application.');
  download(await response.blob(), 'White_Horse_Standard_TB_Import.xlsx');
}

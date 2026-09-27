/// <reference types="node" />

import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import readXlsxFile, { readSheet } from 'read-excel-file/node';
import { parseTrialBalanceFile } from './trialBalanceImport';
import { buildTrialBalanceTemplateCsv, trialBalanceTemplateColumns } from './trialBalanceTemplate';

describe('prescribed Trial Balance template', () => {
  it('uses the documented eight columns and produces a balanced import after population', async () => {
    const csv = buildTrialBalanceTemplateCsv();
    const completedCsv = `${csv}1001,Cash and bank,Assets,Cash and bank,100000,0,75000,0\r\n2001,Share capital,Equity,Share capital,0,100000,0,75000\r\n`;
    const preview = await parseTrialBalanceFile(new File([completedCsv], 'White_Horse_Standard_TB_Import.csv', { type: 'text/csv' }));

    expect(trialBalanceTemplateColumns.map((column) => column.name)).toEqual([
      'Ledger Code', 'Ledger Name', 'Group', 'Subgroup',
      'Closing Debit', 'Closing Credit', 'Previous Debit', 'Previous Credit'
    ]);
    expect(csv.trim().split(/\r?\n/)).toHaveLength(1);
    expect(preview.formatStatus).toBe('STANDARD');
    expect(preview.errors).toEqual([]);
    expect(preview.rows).toHaveLength(2);
    expect(preview.debitTotalPaise).toBe(10_000_000);
    expect(preview.creditTotalPaise).toBe(10_000_000);
    expect(preview.differencePaise).toBe(0);
  });

  it('ships a blank first worksheet with instructions and examples kept separate', async () => {
    const workbook = await readFile(join(process.cwd(), 'public', 'templates', 'White_Horse_Standard_TB_Import.xlsx'));
    const sheets = await readXlsxFile(workbook);
    const importRows = await readSheet(workbook, 1);

    expect(sheets.map((sheet) => sheet.sheet)).toEqual(['Trial Balance Import', 'Instructions', 'Worked Example']);
    expect(importRows).toEqual([trialBalanceTemplateColumns.map((column) => column.name)]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  parseTrialBalanceFile,
  parseTrialBalanceSheets,
  suggestTaxonomyCode,
  type TrialBalanceSourceSheet
} from './trialBalanceImport';

describe('Trial Balance import', () => {
  it('suggests mappings without auto-approval', () => {
    expect(suggestTaxonomyCode('Trade receivables domestic', 'Assets', '')).toBe('BS-CA-RECEIVABLE');
    expect(suggestTaxonomyCode('Finance cost', 'Expense', '')).toBe('PL-EXP-FINANCE');
  });

  it('parses a balanced quoted CSV with comparatives', async () => {
    const file = new File(
      [
        'Ledger Code,Ledger Name,Closing Debit,Closing Credit,Previous Debit,Previous Credit,Group\r\n',
        '100,"Cash, bank and deposits",1000,0,800,0,Assets\r\n',
        '200,Share capital,0,1000,0,800,Equity\r\n'
      ],
      'tb.csv',
      { type: 'text/csv' }
    );
    const preview = await parseTrialBalanceFile(file);
    expect(preview.errors).toEqual([]);
    expect(preview.formatStatus).toBe('COMPATIBLE');
    expect(preview.mappingRequired).toBe(false);
    expect(preview.rows).toHaveLength(2);
    expect(preview.debitTotalPaise).toBe(100_000);
    expect(preview.creditTotalPaise).toBe(100_000);
  });

  it('blocks a Trial Balance difference', async () => {
    const file = new File(
      ['Ledger Code,Ledger Name,Closing Debit,Closing Credit\n100,Cash,1000,0\n200,Capital,0,900\n'],
      'unbalanced.csv',
      { type: 'text/csv' }
    );
    const preview = await parseTrialBalanceFile(file);
    expect(preview.errors.some((error) => error.includes('difference'))).toBe(true);
    expect(preview.differencePaise).toBe(10_000);
  });

  it('imports a common name-only debit/credit export and generates ledger codes', async () => {
    const file = new File(
      ['Account Description,Debit Amount,Credit Amount\nCash,1000,0\nCapital,0,1000\n'],
      'native-export.csv',
      { type: 'text/csv' }
    );
    const preview = await parseTrialBalanceFile(file);
    expect(preview.formatStatus).toBe('COMPATIBLE');
    expect(preview.errors).toEqual([]);
    expect(preview.rows.map((row) => row.code)).toEqual(['AUTO-00002', 'AUTO-00003']);
    expect(preview.warnings.some((warning) => warning.includes('generated'))).toBe(true);
  });

  it('detects a later worksheet and a header below report-title rows', () => {
    const sheets: TrialBalanceSourceSheet[] = [
      { sheet: 'Instructions', data: [['Export instructions'], ['No balances on this sheet']] },
      {
        sheet: 'TB Export',
        data: [
          ['Example Company Private Limited'],
          ['Trial Balance for FY 2025-26'],
          ['Account', 'Dr', 'Cr'],
          ['Cash', '1,00,000.00', ''],
          ['Share capital', '', '1,00,000.00'],
          ['Total', '1,00,000.00', '1,00,000.00']
        ]
      }
    ];
    const preview = parseTrialBalanceSheets(sheets, { fileName: 'multi-sheet.xlsx', sourceType: 'XLSX' });
    expect(preview.selectedWorksheet).toBe('TB Export');
    expect(preview.headerRowNumber).toBe(3);
    expect(preview.rows).toHaveLength(2);
    expect(preview.warnings.some((warning) => warning.includes('total row'))).toBe(true);
  });

  it('never auto-selects a populated worked-example sheet over the blank import sheet', () => {
    const headers = ['Ledger Code', 'Ledger Name', 'Group', 'Subgroup', 'Closing Debit', 'Closing Credit', 'Previous Debit', 'Previous Credit'];
    const preview = parseTrialBalanceSheets([
      { sheet: 'Trial Balance Import', data: [headers] },
      { sheet: 'Instructions', data: [['How to complete this workbook']] },
      {
        sheet: 'Worked Example',
        data: [
          headers,
          ['100', 'Cash', 'Assets', 'Cash', 1000, 0, 900, 0],
          ['200', 'Capital', 'Equity', 'Capital', 0, 1000, 0, 900]
        ]
      }
    ], { fileName: 'standard-template.xlsx', sourceType: 'XLSX' });

    expect(preview.selectedWorksheet).toBe('Trial Balance Import');
    expect(preview.rows).toEqual([]);
    expect(preview.errors).toContain('No ledger rows with balances were found below the selected header.');
  });

  it('recognises two-tier closing-balance headers', () => {
    const preview = parseTrialBalanceSheets([{
      sheet: 'Trial Balance',
      data: [
        ['Account', 'Closing Balance', null],
        ['', 'Debit', 'Credit'],
        ['Cash', 500, 0],
        ['Capital', 0, 500]
      ]
    }], { fileName: 'two-tier.xlsx', sourceType: 'XLSX' });
    expect(preview.headerDepth).toBe(2);
    expect(preview.headerRowNumber).toBe(2);
    expect(preview.errors).toEqual([]);
    expect(preview.rows).toHaveLength(2);
  });

  it('parses one balance column when every value carries a Dr/Cr suffix', () => {
    const preview = parseTrialBalanceSheets([{
      sheet: 'TB',
      data: [
        ['Particulars', 'Balance'],
        ['Cash', '1,250.50 Dr'],
        ['Capital', '1,250.50 Cr']
      ]
    }], { fileName: 'suffix.xlsx', sourceType: 'XLSX' });
    expect(preview.mappingRequired).toBe(false);
    expect(preview.errors).toEqual([]);
    expect(preview.debitTotalPaise).toBe(125_050);
    expect(preview.creditTotalPaise).toBe(125_050);
  });

  it('requires an explicit sign convention for an unsigned balance column', () => {
    const sheets: TrialBalanceSourceSheet[] = [{
      sheet: 'TB',
      data: [
        ['Account Name', 'Closing Balance'],
        ['Cash', 1000],
        ['Capital', -1000]
      ]
    }];
    const detected = parseTrialBalanceSheets(sheets, { fileName: 'signed.xlsx', sourceType: 'XLSX' });
    expect(detected.formatStatus).toBe('NEEDS_MAPPING');
    expect(detected.mappingRequired).toBe(true);
    const mapped = parseTrialBalanceSheets(sheets, { fileName: 'signed.xlsx', sourceType: 'XLSX' }, {
      worksheetName: detected.selectedWorksheet,
      headerRowNumber: detected.headerRowNumber,
      headerDepth: detected.headerDepth,
      columnMap: detected.columnMap,
      signedBalanceConvention: 'DEBIT_POSITIVE'
    });
    expect(mapped.errors).toEqual([]);
    expect(mapped.rows).toHaveLength(2);
    expect(mapped.differencePaise).toBe(0);
  });

  it('uses a separate Dr/Cr indicator with a balance column', () => {
    const preview = parseTrialBalanceSheets([{
      sheet: 'Accounts',
      data: [
        ['GL Account', 'Amount', 'Dr/Cr'],
        ['Bank', '750', 'Dr'],
        ['Equity', '750', 'Cr']
      ]
    }], { fileName: 'indicator.xlsx', sourceType: 'XLSX' });
    expect(preview.errors).toEqual([]);
    expect(preview.rows[0]?.signedCurrentPaise).toBe(75_000);
    expect(preview.rows[1]?.signedCurrentPaise).toBe(-75_000);
  });

  it('supports semicolon-delimited exports', async () => {
    const file = new File(
      ['Particulars;Debit;Credit\nCash;2500;0\nCapital;0;2500\n'],
      'semicolon.csv',
      { type: 'text/csv' }
    );
    const preview = await parseTrialBalanceFile(file);
    expect(preview.errors).toEqual([]);
    expect(preview.rows).toHaveLength(2);
  });

  it('allows explicit manual mapping for unknown vendor headers', () => {
    const sheets: TrialBalanceSourceSheet[] = [{
      sheet: 'Data',
      data: [
        ['Vendor A', 'Vendor B', 'Vendor C'],
        ['Cash', 400, 0],
        ['Capital', 0, 400]
      ]
    }];
    const detected = parseTrialBalanceSheets(sheets, { fileName: 'unknown.xlsx', sourceType: 'XLSX' });
    expect(detected.mappingRequired).toBe(true);
    const mapped = parseTrialBalanceSheets(sheets, { fileName: 'unknown.xlsx', sourceType: 'XLSX' }, {
      worksheetName: 'Data',
      headerRowNumber: 1,
      headerDepth: 1,
      columnMap: { name: 0, closingDebit: 1, closingCredit: 2 }
    });
    expect(mapped.errors).toEqual([]);
    expect(mapped.rows).toHaveLength(2);
  });
});

import { describe, expect, it } from 'vitest';
import { parseTrialBalanceFile, suggestTaxonomyCode } from './trialBalanceImport';

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

  it('explains how to correct an unrecognised source-system export', async () => {
    const file = new File(
      ['Account Description,Debit Amount,Credit Amount\nCash,1000,0\nCapital,0,1000\n'],
      'native-export.csv',
      { type: 'text/csv' }
    );
    const preview = await parseTrialBalanceFile(file);

    expect(preview.formatStatus).toBe('INVALID');
    expect(preview.detectedHeaders).toEqual(['Account Description', 'Debit Amount', 'Credit Amount']);
    expect(preview.errors).toContain('Missing required row-1 columns: Ledger Code, Ledger Name, Closing Debit and Closing Credit.');
    expect(preview.errors.some((error) => error.includes('Download the template'))).toBe(true);
  });
});

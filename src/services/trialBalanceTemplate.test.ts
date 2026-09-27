import { describe, expect, it } from 'vitest';
import { parseTrialBalanceFile } from './trialBalanceImport';
import { buildTrialBalanceTemplateCsv, trialBalanceTemplateColumns } from './trialBalanceTemplate';

describe('prescribed Trial Balance template', () => {
  it('uses the documented eight columns and produces a balanced import preview', async () => {
    const csv = buildTrialBalanceTemplateCsv();
    const preview = await parseTrialBalanceFile(new File([csv], 'White_Horse_Trial_Balance_Template.csv', { type: 'text/csv' }));

    expect(trialBalanceTemplateColumns.map((column) => column.name)).toEqual([
      'Ledger Code', 'Ledger Name', 'Group', 'Subgroup',
      'Closing Debit', 'Closing Credit', 'Previous Debit', 'Previous Credit'
    ]);
    expect(preview.errors).toEqual([]);
    expect(preview.rows).toHaveLength(2);
    expect(preview.debitTotalPaise).toBe(10_000_000);
    expect(preview.creditTotalPaise).toBe(10_000_000);
    expect(preview.differencePaise).toBe(0);
  });
});

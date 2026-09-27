import { describe, expect, it } from 'vitest';
import type { LedgerAccount } from '../domain/types';
import { buildTrialBalanceCsv } from './csvExport';

describe('Trial Balance CSV export', () => {
  it('emits import-compatible exact amounts and escapes quoted text', () => {
    const ledger: LedgerAccount = {
      id: 'ledger-1',
      companyId: 'company-1',
      periodId: 'period-1',
      importId: 'import-1',
      code: '100',
      name: 'Cash "current" account',
      group: 'Assets',
      subGroup: 'Cash',
      openingDebitPaise: 12345,
      openingCreditPaise: 0,
      debitPaise: 100,
      creditPaise: 50,
      closingDebitPaise: 12395,
      closingCreditPaise: 0,
      signedCurrentPaise: 12395,
      signedComparativePaise: -500,
      active: true,
      sourceRow: 2
    };

    const csv = buildTrialBalanceCsv([ledger]);
    expect(csv).toContain('"Cash ""current"" account"');
    expect(csv).toContain('"123.95"');
    expect(csv).toContain('"0.00","5.00"');
    expect(csv.startsWith('\uFEFF"Ledger Code"')).toBe(true);
  });
});

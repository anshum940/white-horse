import type { LedgerAccount } from '../domain/types';

function quote(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function rupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function buildTrialBalanceCsv(ledgers: LedgerAccount[]): string {
  const header = [
    'Ledger Code',
    'Ledger Name',
    'Group',
    'Subgroup',
    'Opening Debit',
    'Opening Credit',
    'Debit',
    'Credit',
    'Closing Debit',
    'Closing Credit',
    'Previous Debit',
    'Previous Credit'
  ];
  const rows = [...ledgers]
    .sort((left, right) => left.code.localeCompare(right.code))
    .map((ledger) => [
      ledger.code,
      ledger.name,
      ledger.group,
      ledger.subGroup,
      rupees(ledger.openingDebitPaise),
      rupees(ledger.openingCreditPaise),
      rupees(ledger.debitPaise),
      rupees(ledger.creditPaise),
      rupees(ledger.closingDebitPaise),
      rupees(ledger.closingCreditPaise),
      rupees(Math.max(ledger.signedComparativePaise, 0)),
      rupees(Math.max(-ledger.signedComparativePaise, 0))
    ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')}\r\n`;
}

export function downloadTrialBalanceCsv(ledgers: LedgerAccount[], fileStem: string): void {
  const blob = new Blob([buildTrialBalanceCsv(ledgers)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileStem.replace(/[^a-z0-9_-]+/gi, '_')}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

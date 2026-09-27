import { describe, expect, it } from 'vitest';
import { formatMoney, rupeesToPaise, safeRatio, sumMoney, variancePercent } from './money';

describe('money', () => {
  it('parses Indian grouping and paise exactly', () => {
    expect(rupeesToPaise('₹1,23,456.78')).toBe(12_345_678);
    expect(rupeesToPaise('(1,250.50)')).toBe(-125_050);
    expect(rupeesToPaise('500 CR')).toBe(-50_000);
    expect(rupeesToPaise('500 DR')).toBe(50_000);
  });

  it('rejects more than two decimal places and unsafe values', () => {
    expect(() => rupeesToPaise('10.999')).toThrow(/Invalid/);
    expect(() => rupeesToPaise('999999999999999999999')).toThrow(/safe integer/);
  });

  it('formats amounts without losing the sign', () => {
    expect(formatMoney(12_345_000_000, 'LAKHS')).toBe('1,234.50');
    expect(formatMoney(-1_250_000_000, 'LAKHS')).toBe('(125.00)');
  });

  it('uses safe aggregation and ratio edge cases', () => {
    expect(sumMoney([100, -40, 20])).toBe(80);
    expect(safeRatio(5, 0)).toBeNull();
    expect(variancePercent(125, 100)).toBe(25);
  });
});

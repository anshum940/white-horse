import type { Money } from './types';

export const PAISA_PER_RUPEE = 100;

export const SCALE_DIVISORS = {
  RUPEES: 100,
  THOUSANDS: 100_000,
  LAKHS: 10_000_000,
  CRORES: 1_000_000_000
} as const;

export type DisplayScale = keyof typeof SCALE_DIVISORS;

export function assertSafeMoney(value: number, field = 'amount'): Money {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${field} must be a safe integer number of paise.`);
  }
  return value;
}
export function rupeesToPaise(input: string | number): Money {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new TypeError('Amount must be finite.');
    }
    return assertSafeMoney(Math.round(input * PAISA_PER_RUPEE));
  }

  let raw = input.trim();
  if (!raw || raw === '-' || raw === '—') {
    return 0;
  }

  let negative = false;
  if (/^\(.*\)$/.test(raw)) {
    negative = true;
    raw = raw.slice(1, -1).trim();
  }

  const suffix = raw.match(/\s*(dr|cr)$/i)?.[1]?.toUpperCase();
  if (suffix) {
    raw = raw.replace(/\s*(dr|cr)$/i, '').trim();
    negative = suffix === 'CR';
  }

  raw = raw.replace(/[₹,\s]/g, '');
  if (raw.startsWith('+')) raw = raw.slice(1);
  if (raw.startsWith('-')) {
    negative = !negative;
    raw = raw.slice(1);
  }

  if (!/^\d+(\.\d{0,2})?$/.test(raw)) {
    throw new TypeError(`Invalid monetary amount: ${input}`);
  }

  const [whole = '0', fraction = ''] = raw.split('.');
  const paiseText = `${whole}${fraction.padEnd(2, '0')}`.replace(/^0+(?=\d)/, '');
  const paiseBigInt = BigInt(paiseText || '0') * (negative ? -1n : 1n);
  if (paiseBigInt > BigInt(Number.MAX_SAFE_INTEGER) || paiseBigInt < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError('Amount exceeds the supported safe integer range.');
  }
  return Number(paiseBigInt);
}

export function formatMoney(
  paise: Money,
  scale: DisplayScale = 'LAKHS',
  options: { showZero?: boolean; decimals?: number; currencySymbol?: boolean } = {}
): string {
  assertSafeMoney(paise);
  if (paise === 0 && options.showZero === false) return '—';
  const divisor = SCALE_DIVISORS[scale];
  const value = paise / divisor;
  const decimals = options.decimals ?? (scale === 'RUPEES' ? 0 : 2);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Math.abs(value));
  const prefix = paise < 0 ? '(' : '';
  const suffix = paise < 0 ? ')' : '';
  const currency = options.currencySymbol ? '₹' : '';
  return `${prefix}${currency}${formatted}${suffix}`;
}

export function formatIndianRupees(paise: Money, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(paise / PAISA_PER_RUPEE);
}

export function sumMoney(values: Iterable<Money>): Money {
  let total = 0;
  for (const value of values) {
    total = assertSafeMoney(total + assertSafeMoney(value));
  }
  return total;
}

export function variancePercent(current: Money, comparative: Money): number | null {
  if (comparative === 0) return null;
  return ((current - comparative) / Math.abs(comparative)) * 100;
}

export function safeRatio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

export function formatRatio(value: number | null, suffix = 'x'): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return `${value.toFixed(2)}${suffix}`;
}

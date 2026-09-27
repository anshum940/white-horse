import { safeRatio } from './money';
import type { FinancialStatements, KpiSet } from './types';

export interface RatioScheduleRow {
  name: string;
  formula: string;
  current: number | null;
  comparative: number | null;
  format: 'x' | '%';
  benchmark: string;
  withinRange: boolean | null;
}

export function calculateRatioSchedule(statements: FinancialStatements, kpis: KpiSet): RatioScheduleRow[] {
  const allLines = [...statements.balanceSheet, ...statements.profitAndLoss];
  const amount = (code: string, comparative = false) => {
    const line = allLines.find((item) => item.code === code);
    return comparative ? line?.comparativePaise ?? 0 : line?.currentPaise ?? 0;
  };
  const average = (code: string) => (amount(code) + amount(code, true)) / 2;
  const averageWorkingCapital = (kpis.workingCapital + kpis.comparativeWorkingCapital) / 2;
  const definitions: Array<Omit<RatioScheduleRow, 'withinRange'> & { test: (value: number) => boolean }> = [
    { name: 'Current ratio', formula: 'Current assets / Current liabilities', current: kpis.currentRatio, comparative: kpis.comparativeCurrentRatio, format: 'x', benchmark: 'Entity policy; illustrative ≥ 1.50x', test: (value) => value >= 1.5 },
    { name: 'Debt–equity ratio', formula: 'Total debt / Shareholders’ equity', current: kpis.debtEquityRatio, comparative: kpis.comparativeDebtEquityRatio, format: 'x', benchmark: 'Entity policy; illustrative ≤ 1.00x', test: (value) => value <= 1 },
    { name: 'Debt service coverage ratio', formula: 'Earnings available for debt service / Debt service', current: null, comparative: null, format: 'x', benchmark: 'Requires principal-repayment input', test: () => false },
    { name: 'Return on equity', formula: 'Profit after tax / Average equity', current: kpis.roe, comparative: kpis.comparativeRoe, format: '%', benchmark: 'Entity policy; illustrative ≥ 15.0%', test: (value) => value >= 0.15 },
    { name: 'Inventory turnover', formula: 'Cost of materials / Average inventory', current: safeRatio(amount('PL-EXP-MATERIAL'), average('BS-CA-INVENTORY')), comparative: safeRatio(amount('PL-EXP-MATERIAL', true), amount('BS-CA-INVENTORY', true)), format: 'x', benchmark: 'Trend review', test: (value) => value >= 4 },
    { name: 'Trade receivables turnover', formula: 'Revenue from operations / Average trade receivables', current: safeRatio(kpis.revenue, average('BS-CA-RECEIVABLE')), comparative: safeRatio(kpis.comparativeRevenue, amount('BS-CA-RECEIVABLE', true)), format: 'x', benchmark: 'Trend review; illustrative ≥ 7.00x', test: (value) => value >= 7 },
    { name: 'Trade payables turnover', formula: 'Cost of materials / Average trade payables', current: safeRatio(amount('PL-EXP-MATERIAL'), average('BS-CL-PAYABLE')), comparative: safeRatio(amount('PL-EXP-MATERIAL', true), amount('BS-CL-PAYABLE', true)), format: 'x', benchmark: 'Trend review', test: (value) => value >= 6 },
    { name: 'Net capital turnover', formula: 'Revenue from operations / Average working capital', current: safeRatio(kpis.revenue, averageWorkingCapital), comparative: safeRatio(kpis.comparativeRevenue, kpis.comparativeWorkingCapital), format: 'x', benchmark: 'Trend review', test: (value) => value >= 5 },
    { name: 'Net profit ratio', formula: 'Profit after tax / Revenue from operations', current: safeRatio(kpis.profitAfterTax, kpis.revenue), comparative: safeRatio(kpis.comparativeProfitAfterTax, kpis.comparativeRevenue), format: '%', benchmark: 'Entity policy; illustrative ≥ 8.0%', test: (value) => value >= 0.08 },
    { name: 'Return on capital employed', formula: 'EBIT / Average capital employed', current: kpis.roce, comparative: kpis.comparativeRoce, format: '%', benchmark: 'Entity policy; illustrative ≥ 18.0%', test: (value) => value >= 0.18 },
    { name: 'Return on investment', formula: 'Investment income / Average investments', current: safeRatio(amount('PL-REV-OTHER'), average('BS-NCA-INVESTMENT')), comparative: safeRatio(amount('PL-REV-OTHER', true), amount('BS-NCA-INVESTMENT', true)), format: '%', benchmark: 'Policy-specific', test: (value) => value >= 0.08 },
    { name: 'Interest coverage ratio', formula: 'EBIT / Finance costs', current: kpis.interestCoverage, comparative: kpis.comparativeInterestCoverage, format: 'x', benchmark: 'Entity policy; illustrative ≥ 3.00x', test: (value) => value >= 3 }
  ];
  return definitions.map(({ test, ...row }) => ({
    ...row,
    withinRange: row.current === null ? null : test(row.current)
  }));
}

export function formatRatioValue(value: number | null, format: RatioScheduleRow['format']): string {
  if (value === null) return 'N/A';
  return format === '%' ? `${(value * 100).toFixed(2)}%` : `${value.toFixed(2)}x`;
}

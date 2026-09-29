import { describe, expect, it } from 'vitest';
import { demoDataset } from '../data/demo';
import { taxonomy } from '../data/taxonomy';
import { calculateFinancialStatements, calculateKpis } from './statements';

const context = {
  period: demoDataset.period,
  ledgers: demoDataset.ledgers,
  mappings: demoDataset.mappings,
  adjustments: demoDataset.adjustments,
  adjustmentLines: demoDataset.adjustmentLines,
  taxonomy
};

describe('financial statement engine', () => {
  it('applies only posted balanced adjustments and balances the Balance Sheet exactly', () => {
    const statements = calculateFinancialStatements(context);
    expect(statements.totals.currentProfit).toBe(425_000_000);
    expect(statements.totals.totalAssets).toBe(3_100_000_000);
    expect(statements.totals.balanceSheetDifference).toBe(0);
    expect(statements.totals.comparativeBalanceSheetDifference).toBe(0);
    expect(statements.balanceSheet[0]?.code).toBe('BS-EQUITY-LIABILITIES');
    expect(statements.balanceSheet.findIndex((line) => line.code === 'BS-TOTAL-EQUITY-LIABILITIES')).toBeLessThan(
      statements.balanceSheet.findIndex((line) => line.code === 'BS-ASSETS')
    );
    expect(statements.balanceSheet.at(-1)?.code).toBe('BS-TOTAL-ASSETS');
  });

  it('reconciles indirect cash flow to the cash balance movement', () => {
    const statements = calculateFinancialStatements(context);
    expect(statements.totals.cashFlowMovement).toBe(90_000_000);
    expect(statements.totals.cashMovementPerBalanceSheet).toBe(90_000_000);
    expect(statements.totals.cashFlowDifference).toBe(0);
  });

  it('calculates management KPIs from transparent statement components', () => {
    const statements = calculateFinancialStatements(context);
    const kpis = calculateKpis(context, statements);
    expect(kpis.revenue).toBe(4_800_000_000);
    expect(kpis.ebitda).toBe(865_000_000);
    expect(kpis.ebit).toBe(705_000_000);
    expect(kpis.netWorth).toBe(1_625_000_000);
    expect(kpis.currentRatio).toBeCloseTo(1.7289, 3);
  });
});

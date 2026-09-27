import { describe, expect, it } from 'vitest';
import { demoDataset } from '../data/demo';
import { taxonomy } from '../data/taxonomy';
import { calculateFinancialStatements, calculateKpis } from './statements';
import { calculateRatioSchedule } from './ratios';

describe('Schedule III analytical ratio schedule', () => {
  it('generates the complete configured ratio set without fabricating unavailable DSCR data', () => {
    const context = {
      period: demoDataset.period,
      ledgers: demoDataset.ledgers,
      mappings: demoDataset.mappings,
      adjustments: demoDataset.adjustments,
      adjustmentLines: demoDataset.adjustmentLines,
      taxonomy
    };
    const statements = calculateFinancialStatements(context);
    const rows = calculateRatioSchedule(statements, calculateKpis(context, statements));

    expect(rows).toHaveLength(12);
    expect(rows.map((row) => row.name)).toContain('Debt service coverage ratio');
    expect(rows.find((row) => row.name === 'Debt service coverage ratio')?.current).toBeNull();
    expect(rows.find((row) => row.name === 'Current ratio')?.current).toBeCloseTo(1.7289, 3);
  });
});

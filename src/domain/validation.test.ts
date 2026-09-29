import { describe, expect, it } from 'vitest';
import { demoDataset } from '../data/demo';
import { taxonomy } from '../data/taxonomy';
import { ragStatus, validateWorkspace } from './validation';

const context = {
  period: demoDataset.period,
  ledgers: demoDataset.ledgers,
  mappings: demoDataset.mappings,
  adjustments: demoDataset.adjustments,
  adjustmentLines: demoDataset.adjustmentLines,
  taxonomy
};

describe('validation engine', () => {
  it('passes the balanced synthetic dataset and flags a submitted adjustment for review', () => {
    const results = validateWorkspace(context);
    expect(results.some((result) => result.ruleId === 'TB-001')).toBe(false);
    expect(results.some((result) => result.ruleId === 'BS-001')).toBe(false);
    expect(results.some((result) => result.ruleId === 'CF-001')).toBe(false);
    expect(results.some((result) => result.ruleId === 'ADJ-003')).toBe(true);
    expect(ragStatus(results)).toBe('AMBER');
  });

  it('blocks an unbalanced TB', () => {
    const broken = {
      ...context,
      ledgers: context.ledgers.map((ledger, index) =>
        index === 0 ? { ...ledger, signedCurrentPaise: ledger.signedCurrentPaise + 1 } : ledger
      )
    };
    const results = validateWorkspace(broken);
    expect(results.some((result) => result.ruleId === 'TB-001' && result.severity === 'BLOCKING')).toBe(true);
    expect(ragStatus(results)).toBe('RED');
  });

  it('blocks an unbalanced comparative TB', () => {
    const broken = {
      ...context,
      ledgers: context.ledgers.map((ledger, index) =>
        index === 0 ? { ...ledger, signedComparativePaise: ledger.signedComparativePaise + 1 } : ledger
      )
    };
    const results = validateWorkspace(broken);
    expect(results.some((result) => result.ruleId === 'TB-002' && result.severity === 'BLOCKING')).toBe(true);
    expect(ragStatus(results)).toBe('RED');
  });

  it('blocks duplicate mappings for one ledger', () => {
    const [firstMapping, secondMapping] = context.mappings;
    if (!firstMapping || !secondMapping) throw new Error('The synthetic validation fixture needs at least two mappings.');
    const duplicate = {
      ...context,
      mappings: [
        ...context.mappings,
        { ...firstMapping, id: 'mapping-duplicate', taxonomyCode: secondMapping.taxonomyCode }
      ]
    };
    const results = validateWorkspace(duplicate);
    expect(results.some((result) => result.ruleId === 'MAP-004' && result.severity === 'BLOCKING')).toBe(true);
  });

  it('blocks an unbalanced adjustment independently of posting state', () => {
    const broken = {
      ...context,
      adjustmentLines: context.adjustmentLines.map((line) =>
        line.id === 'adj-line-003-2' ? { ...line, creditPaise: line.creditPaise - 100 } : line
      )
    };
    const results = validateWorkspace(broken);
    expect(results.some((result) => result.ruleId === 'ADJ-001')).toBe(true);
  });

  it('blocks malformed journal lines and identifies unavailable ledgers', () => {
    const broken = {
      ...context,
      adjustmentLines: context.adjustmentLines.map((line, index) =>
        index === 0
          ? { ...line, ledgerId: 'missing-ledger', debitPaise: 100, creditPaise: 100 }
          : line
      )
    };
    const results = validateWorkspace(broken);
    expect(results.some((result) => result.ruleId === 'ADJ-002' && result.severity === 'BLOCKING')).toBe(true);
    expect(results.some((result) => result.ruleId === 'ADJ-004' && result.severity === 'ERROR')).toBe(true);
  });
});

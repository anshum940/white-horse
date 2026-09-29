import { describe, expect, it } from 'vitest';
import { demoDataset } from '../data/demo';
import { taxonomy } from '../data/taxonomy';
import { buildNoteSchedule } from './noteSchedules';
import { calculateFinancialStatements } from './statements';

const statements = calculateFinancialStatements({
  period: demoDataset.period,
  ledgers: demoDataset.ledgers,
  mappings: demoDataset.mappings,
  adjustments: demoDataset.adjustments,
  adjustmentLines: demoDataset.adjustmentLines,
  taxonomy
});

function note(number: string) {
  const result = demoDataset.notes.find((candidate) => candidate.noteNumber === number);
  if (!result) throw new Error(`Demo note ${number} is missing.`);
  return result;
}

describe('Schedule III note schedules', () => {
  it('reconciles ledger-level PPE detail to the mapped statement line', () => {
    const schedule = buildNoteSchedule(note('3'), demoDataset, statements);
    const statementLine = statements.balanceSheet.find((line) => line.code === 'BS-NCA-PPE');

    expect(schedule.rows.length).toBeGreaterThan(0);
    expect(schedule.totalCurrentPaise).toBe(statementLine?.currentPaise);
    expect(schedule.totalComparativePaise).toBe(statementLine?.comparativePaise);
  });

  it('shows a mathematically complete net carrying amount bridge without inventing FAR movements', () => {
    const schedule = buildNoteSchedule(note('3'), demoDataset, statements);
    const [opening, movement, closing] = schedule.movementRows ?? [];

    expect(opening?.amountPaise).toBe(schedule.totalComparativePaise);
    expect((opening?.amountPaise ?? 0) + (movement?.amountPaise ?? 0)).toBe(closing?.amountPaise);
    expect(closing?.amountPaise).toBe(schedule.totalCurrentPaise);
    expect(schedule.movementScope).toContain('fixed-asset register');
  });

  it('presents normal credit balances as positive note values', () => {
    const schedule = buildNoteSchedule(note('12'), demoDataset, statements);
    expect(schedule.totalCurrentPaise).toBeGreaterThan(0);
    expect(schedule.rows.every((row) => row.currentPaise >= 0)).toBe(true);
  });

  it('includes posted adjustment effects in ledger-level schedules', () => {
    const inventorySchedule = buildNoteSchedule(note('7'), demoDataset, statements);
    const inventoryLine = statements.balanceSheet.find((line) => line.code === 'BS-CA-INVENTORY');
    expect(inventorySchedule.totalCurrentPaise).toBe(inventoryLine?.currentPaise);
  });
});

import { describe, expect, it } from 'vitest';
import { createDivisionINoteTemplates, divisionIDisclosureGuidance } from './noteTemplates';

describe('Division I note templates', () => {
  it('creates the full note index with unique numbers and active-company identifiers', () => {
    const notes = createDivisionINoteTemplates({
      companyId: 'company-a',
      periodId: 'period-a',
      companyName: 'Example Company Private Limited',
      owner: 'Abhijit',
      now: '2026-09-27T00:00:00.000Z'
    });

    expect(notes).toHaveLength(30);
    expect(new Set(notes.map((note) => note.noteNumber)).size).toBe(30);
    expect(notes.every((note) => note.companyId === 'company-a' && note.periodId === 'period-a')).toBe(true);
    expect(notes.find((note) => note.noteNumber === '30')?.title).toBe('Additional regulatory information');
  });

  it('keeps the Schedule III completion guidance aligned to the mapped note numbers', () => {
    expect(divisionIDisclosureGuidance['3']).toContain('gross carrying amount');
    expect(divisionIDisclosureGuidance['3']).toContain('title-deed');
    expect(divisionIDisclosureGuidance['8']).toContain('trade-receivable ageing schedule');
    expect(divisionIDisclosureGuidance['17']).toContain('trade-payable ageing schedules');
    expect(divisionIDisclosureGuidance['25']).toContain('other-expense');
    expect(divisionIDisclosureGuidance['26']).toContain('depreciation and amortisation');
    expect(divisionIDisclosureGuidance['27']).toContain('finance-cost');
  });
});

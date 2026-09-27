import { describe, expect, it } from 'vitest';
import { createDivisionINoteTemplates } from './noteTemplates';

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
});

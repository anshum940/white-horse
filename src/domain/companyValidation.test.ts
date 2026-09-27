import { describe, expect, it } from 'vitest';
import {
  CIN_LENGTH,
  assertValidCompanyWorkspaceInput,
  defaultIndianFinancialPeriods,
  isValidCin,
  normaliseCinInput,
  validateCompanyWorkspaceInput,
  type CompanyWorkspaceInput
} from './companyValidation';

const validInput = (): CompanyWorkspaceInput => ({
  legalName: 'Northstar Components Private Limited',
  tradeName: 'Northstar',
  cin: 'U27100MH2014PTC123456',
  registeredOffice: 'Mumbai, Maharashtra, India',
  industry: 'Industrial components',
  displayScale: 'LAKHS',
  periodLabel: 'FY 2026–27',
  startDate: '2026-04-01',
  endDate: '2027-03-31',
  comparativeLabel: 'FY 2025–26',
  comparativeStartDate: '2025-04-01',
  comparativeEndDate: '2026-03-31',
  materialityPaise: 25_000_000
});

describe('company workspace validation', () => {
  it('accepts a complete company and non-overlapping reporting periods', () => {
    expect(validateCompanyWorkspaceInput(validInput())).toEqual({});
    expect(() => assertValidCompanyWorkspaceInput(validInput())).not.toThrow();
  });

  it('normalises CIN input to uppercase alphanumeric and limits it to 21 characters', () => {
    const normalised = normaliseCinInput('u-27100 mh 2014 ptc 123456 extra');
    expect(normalised).toBe('U27100MH2014PTC123456');
    expect(normalised).toHaveLength(CIN_LENGTH);
    expect(isValidCin(normalised)).toBe(true);
  });

  it('rejects the wrong CIN length, characters, or component structure', () => {
    expect(validateCompanyWorkspaceInput({ ...validInput(), cin: 'U27100MH2014PTC12345' }).cin).toContain('exactly 21');
    expect(validateCompanyWorkspaceInput({ ...validInput(), cin: 'U27100MH2014PTC12345!' }).cin).toContain('letters and numbers only');
    expect(validateCompanyWorkspaceInput({ ...validInput(), cin: 'A27100MH2014PTC123456' }).cin).toContain('CIN structure');
  });

  it('rejects invalid calendar dates, reversed ranges, and overlapping comparatives', () => {
    expect(validateCompanyWorkspaceInput({ ...validInput(), startDate: '2026-02-30' }).startDate).toContain('valid calendar date');
    expect(validateCompanyWorkspaceInput({ ...validInput(), endDate: '2026-03-31' }).endDate).toContain('on or after');
    expect(validateCompanyWorkspaceInput({ ...validInput(), comparativeEndDate: '2026-04-01' }).comparativeEndDate).toContain('before the current period');
  });

  it('rejects duplicated period labels and invalid materiality', () => {
    const errors = validateCompanyWorkspaceInput({
      ...validInput(),
      comparativeLabel: '  fy 2026–27 ',
      materialityPaise: 1.5
    });
    expect(errors.comparativeLabel).toContain('must be different');
    expect(errors.materialityPaise).toContain('positive amount');
  });

  it('requires every identity and reporting field and enforces text limits', () => {
    const errors = validateCompanyWorkspaceInput({
      ...validInput(),
      legalName: ' ',
      tradeName: 'x'.repeat(81),
      registeredOffice: ''
    });
    expect(errors.legalName).toBe('Required.');
    expect(errors.tradeName).toContain('80');
    expect(errors.registeredOffice).toBe('Required.');
  });

  it('derives current Indian financial-year defaults instead of shipping stale fixed dates', () => {
    expect(defaultIndianFinancialPeriods(new Date(2026, 8, 28))).toEqual({
      periodLabel: 'FY 2026–27',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      comparativeLabel: 'FY 2025–26',
      comparativeStartDate: '2025-04-01',
      comparativeEndDate: '2026-03-31'
    });
    expect(defaultIndianFinancialPeriods(new Date(2026, 1, 15)).periodLabel).toBe('FY 2025–26');
  });
});

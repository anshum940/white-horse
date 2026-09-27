import type { Company } from './types';

export const CIN_LENGTH = 21;
export const CIN_PATTERN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

export interface CompanyWorkspaceInput {
  legalName: string;
  tradeName: string;
  cin: string;
  registeredOffice: string;
  industry: string;
  displayScale: Company['displayScale'];
  periodLabel: string;
  startDate: string;
  endDate: string;
  comparativeLabel: string;
  comparativeStartDate: string;
  comparativeEndDate: string;
  materialityPaise: number;
}

export type CompanyWorkspaceField = keyof CompanyWorkspaceInput;
export type CompanyWorkspaceValidationErrors = Partial<Record<CompanyWorkspaceField, string>>;

const TEXT_LIMITS: Partial<Record<CompanyWorkspaceField, number>> = {
  legalName: 200,
  tradeName: 80,
  registeredOffice: 500,
  industry: 160,
  periodLabel: 40,
  comparativeLabel: 40
};

const REQUIRED_TEXT_FIELDS: Array<Exclude<CompanyWorkspaceField, 'displayScale' | 'materialityPaise'>> = [
  'legalName',
  'tradeName',
  'cin',
  'registeredOffice',
  'industry',
  'periodLabel',
  'startDate',
  'endDate',
  'comparativeLabel',
  'comparativeStartDate',
  'comparativeEndDate'
];

export function normaliseCinInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CIN_LENGTH);
}

export function isValidCin(value: string): boolean {
  return CIN_PATTERN.test(value.trim().toUpperCase());
}

function isIsoCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateCompanyWorkspaceInput(input: CompanyWorkspaceInput): CompanyWorkspaceValidationErrors {
  const errors: CompanyWorkspaceValidationErrors = {};

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!input[field].trim()) errors[field] = 'Required.';
  }

  for (const [field, limit] of Object.entries(TEXT_LIMITS) as Array<[CompanyWorkspaceField, number]>) {
    const value = input[field];
    if (typeof value === 'string' && value.trim().length > limit) {
      errors[field] = `Use ${limit} characters or fewer.`;
    }
  }

  if (!(['RUPEES', 'THOUSANDS', 'LAKHS', 'CRORES'] as string[]).includes(input.displayScale)) {
    errors.displayScale = 'Select a supported presentation scale.';
  }

  const cin = input.cin.trim().toUpperCase();
  if (cin && !/^[A-Z0-9]+$/.test(cin)) {
    errors.cin = 'CIN can contain uppercase English letters and numbers only.';
  } else if (cin && cin.length !== CIN_LENGTH) {
    errors.cin = `CIN must contain exactly ${CIN_LENGTH} characters (${cin.length}/${CIN_LENGTH}).`;
  } else if (cin && !isValidCin(cin)) {
    errors.cin = 'Use the CIN structure L/U + 5 digits + 2 letters + 4-digit year + 3 letters + 6 digits.';
  }

  const dateFields = ['startDate', 'endDate', 'comparativeStartDate', 'comparativeEndDate'] as const;
  for (const field of dateFields) {
    if (input[field] && !isIsoCalendarDate(input[field])) errors[field] = 'Enter a valid calendar date.';
  }

  if (!errors.startDate && !errors.endDate && input.endDate < input.startDate) {
    errors.endDate = 'The reporting-period end date must be on or after its start date.';
  }
  if (!errors.comparativeStartDate && !errors.comparativeEndDate && input.comparativeEndDate < input.comparativeStartDate) {
    errors.comparativeEndDate = 'The comparative-period end date must be on or after its start date.';
  }
  if (!errors.startDate && !errors.comparativeEndDate && input.comparativeEndDate >= input.startDate) {
    errors.comparativeEndDate = 'The comparative period must end before the current period starts.';
  }
  if (
    input.periodLabel.trim()
    && input.comparativeLabel.trim()
    && input.periodLabel.trim().toLocaleLowerCase('en-IN') === input.comparativeLabel.trim().toLocaleLowerCase('en-IN')
  ) {
    errors.comparativeLabel = 'Current and comparative period labels must be different.';
  }

  if (!Number.isSafeInteger(input.materialityPaise) || input.materialityPaise <= 0) {
    errors.materialityPaise = 'Materiality must be a positive amount with no more than two decimal places.';
  }

  return errors;
}

export function assertValidCompanyWorkspaceInput(input: CompanyWorkspaceInput): void {
  const errors = validateCompanyWorkspaceInput(input);
  const firstError = Object.values(errors)[0];
  if (firstError) throw new Error(firstError);
}

function financialYearLabel(startYear: number): string {
  const endYear = String(startYear + 1).slice(-2);
  return `FY ${startYear}–${endYear}`;
}

export function defaultIndianFinancialPeriods(today = new Date()): Pick<
  CompanyWorkspaceInput,
  'periodLabel' | 'startDate' | 'endDate' | 'comparativeLabel' | 'comparativeStartDate' | 'comparativeEndDate'
> {
  const currentStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const comparativeStartYear = currentStartYear - 1;
  return {
    periodLabel: financialYearLabel(currentStartYear),
    startDate: `${currentStartYear}-04-01`,
    endDate: `${currentStartYear + 1}-03-31`,
    comparativeLabel: financialYearLabel(comparativeStartYear),
    comparativeStartDate: `${comparativeStartYear}-04-01`,
    comparativeEndDate: `${currentStartYear}-03-31`
  };
}

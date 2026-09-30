import type { DirectorSignatory, StatementSignatureSettings } from './types';

export type SignatureSettingsField = keyof StatementSignatureSettings;
export type SignatureSettingsErrors = Record<string, string>;
export const MAX_DIRECTOR_SIGNATORIES = 2;

export function defaultStatementSignatureSettings(periodEndDate: string, registeredOffice = ''): StatementSignatureSettings {
  return {
    showDirector: false,
    directorName: '',
    directorDesignation: 'Director',
    directorDin: '',
    additionalDirectors: [],
    showCharteredAccountant: false,
    caCapacity: 'PREPARER',
    caFirmName: '',
    caFirmRegistrationNumber: '',
    caName: '',
    caDesignation: 'Partner / Proprietor',
    caMembershipNumber: '',
    caUdin: '',
    place: registeredOffice.split(',')[0]?.trim() ?? '',
    signingDate: periodEndDate
  };
}

export function normaliseStatementSignatureSettings(settings: StatementSignatureSettings): StatementSignatureSettings {
  return {
    ...settings,
    directorName: settings.directorName.trim(),
    directorDesignation: settings.directorDesignation.trim(),
    directorDin: settings.directorDin.replace(/\D/g, '').slice(0, 8),
    additionalDirectors: (settings.additionalDirectors ?? []).map((director): DirectorSignatory => ({
      name: director.name.trim(),
      designation: director.designation.trim(),
      din: director.din.replace(/\D/g, '').slice(0, 8)
    })),
    caFirmName: settings.caFirmName.trim(),
    caFirmRegistrationNumber: settings.caFirmRegistrationNumber.trim().toUpperCase(),
    caName: settings.caName.trim(),
    caDesignation: settings.caDesignation.trim(),
    caMembershipNumber: settings.caMembershipNumber.replace(/\D/g, '').slice(0, 6),
    caUdin: settings.caUdin.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 18),
    place: settings.place.trim(),
    signingDate: settings.signingDate.trim()
  };
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateStatementSignatureSettings(
  rawSettings: StatementSignatureSettings,
  options: { periodEndDate?: string } = {}
): SignatureSettingsErrors {
  const settings = normaliseStatementSignatureSettings(rawSettings);
  const errors: SignatureSettingsErrors = {};
  const required = (field: SignatureSettingsField, message: string) => {
    if (!String(settings[field] ?? '').trim()) errors[field] = message;
  };

  if (settings.showDirector) {
    required('directorName', 'Enter the director’s full name.');
    required('directorDesignation', 'Enter the director’s designation.');
    if (!/^\d{8}$/.test(settings.directorDin)) errors.directorDin = 'DIN must contain exactly 8 digits. This validates format only, not MCA status.';
    const additional = settings.additionalDirectors ?? [];
    if (additional.length > MAX_DIRECTOR_SIGNATORIES - 1) errors.additionalDirectors = `A maximum of ${MAX_DIRECTOR_SIGNATORIES} Director signing blocks fits the statement layout.`;
    additional.forEach((director, index) => {
      if (!director.name) errors[`additionalDirector.${index}.name`] = 'Enter the additional director’s full name.';
      if (director.name.length > 150) errors[`additionalDirector.${index}.name`] = 'Use 150 characters or fewer.';
      if (!director.designation) errors[`additionalDirector.${index}.designation`] = 'Enter the additional director’s designation.';
      if (director.designation.length > 80) errors[`additionalDirector.${index}.designation`] = 'Use 80 characters or fewer.';
      if (!/^\d{8}$/.test(director.din)) errors[`additionalDirector.${index}.din`] = 'DIN must contain exactly 8 digits. This validates format only, not MCA status.';
      else if (director.din === settings.directorDin || additional.slice(0, index).some((other) => other.din === director.din)) {
        errors[`additionalDirector.${index}.din`] = 'Each Director signing block needs a different DIN.';
      }
    });
  }

  if (settings.showCharteredAccountant) {
    required('caFirmName', 'Enter the CA firm or practitioner name.');
    required('caName', 'Enter the signing CA’s full name.');
    required('caDesignation', 'Enter Partner, Proprietor or the applicable capacity.');
    if (!/^\d{6}$/.test(settings.caMembershipNumber)) errors.caMembershipNumber = 'ICAI membership number must contain exactly 6 digits.';
    if (settings.caUdin && !/^\d{8}[A-Z0-9]{10}$/.test(settings.caUdin)) errors.caUdin = 'UDIN must contain 18 characters: 8 leading digits followed by 10 letters/numbers.';
  }

  if (settings.showDirector || settings.showCharteredAccountant) {
    required('place', 'Enter the place of signing.');
    if (!validIsoDate(settings.signingDate)) errors.signingDate = 'Enter a valid signing date.';
    else if (options.periodEndDate && settings.signingDate < options.periodEndDate) errors.signingDate = 'Signing date cannot be before the reporting-period end date.';
  }

  const limits: Partial<Record<SignatureSettingsField, number>> = {
    directorName: 150,
    directorDesignation: 80,
    caFirmName: 180,
    caFirmRegistrationNumber: 30,
    caName: 150,
    caDesignation: 80,
    place: 120
  };
  for (const [field, limit] of Object.entries(limits) as Array<[SignatureSettingsField, number]>) {
    if (String(settings[field] ?? '').length > limit) errors[field] = `Use ${limit} characters or fewer.`;
  }
  return errors;
}

export function assertValidStatementSignatureSettings(settings: StatementSignatureSettings, periodEndDate?: string): void {
  const errors = validateStatementSignatureSettings(settings, { periodEndDate });
  const first = Object.values(errors)[0];
  if (first) throw new Error(first);
}

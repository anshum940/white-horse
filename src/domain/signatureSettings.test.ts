import { describe, expect, it } from 'vitest';
import {
  defaultStatementSignatureSettings,
  normaliseStatementSignatureSettings,
  validateStatementSignatureSettings
} from './signatureSettings';

describe('statement signature settings', () => {
  it('allows both optional blocks to remain hidden', () => {
    const settings = defaultStatementSignatureSettings('2026-03-31', 'Pune, Maharashtra');
    expect(validateStatementSignatureSettings(settings, { periodEndDate: '2026-03-31' })).toEqual({});
    expect(settings.place).toBe('Pune');
  });

  it('requires valid Director and CA identity formats when blocks are shown', () => {
    const settings = {
      ...defaultStatementSignatureSettings('2026-03-31'),
      showDirector: true,
      directorName: 'Director One',
      directorDin: '123',
      showCharteredAccountant: true,
      caFirmName: 'Example & Co.',
      caName: 'CA Example',
      caMembershipNumber: '12',
      caUdin: 'BAD',
      place: 'Pune'
    };
    const errors = validateStatementSignatureSettings(settings, { periodEndDate: '2026-03-31' });
    expect(errors.directorDin).toContain('8 digits');
    expect(errors.caMembershipNumber).toContain('6 digits');
    expect(errors.caUdin).toContain('18 characters');
  });

  it('normalises identifiers and blocks a signing date before year end', () => {
    const settings = normaliseStatementSignatureSettings({
      ...defaultStatementSignatureSettings('2026-03-31'),
      showDirector: true,
      directorName: ' Director One ',
      directorDin: '12 34-5678',
      place: ' Pune ',
      signingDate: '2026-03-30'
    });
    expect(settings.directorDin).toBe('12345678');
    expect(settings.directorName).toBe('Director One');
    expect(validateStatementSignatureSettings(settings, { periodEndDate: '2026-03-31' }).signingDate).toContain('cannot be before');
  });
});

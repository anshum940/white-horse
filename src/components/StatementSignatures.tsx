import type { StatementSignatureSettings } from '../domain/types';

function capacityHeading(capacity: StatementSignatureSettings['caCapacity']): string {
  if (capacity === 'STATUTORY_AUDITOR') return 'As per our report of even date';
  if (capacity === 'COMPILER') return 'Compiled by';
  return 'Prepared by';
}

export function StatementSignatures({ settings }: { settings?: StatementSignatureSettings }) {
  if (!settings || (!settings.showDirector && !settings.showCharteredAccountant)) return null;
  const signingDate = settings.signingDate
    ? new Date(`${settings.signingDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  return (
    <section className="statement-signatures" aria-label="Financial statement signing blocks">
      <div className="signature-column signature-director">
        {settings.showDirector && <>
          <p>For and on behalf of the Board</p>
          <div className={`signature-director-people ${(settings.additionalDirectors?.length ?? 0) > 0 ? 'multiple' : ''}`}>
            {[
              { name: settings.directorName, designation: settings.directorDesignation, din: settings.directorDin },
              ...(settings.additionalDirectors ?? [])
            ].map((director, index) => <div className="signature-director-person" key={`${director.din}-${index}`}>
              <span className="signature-line">Director signature</span>
              <strong>{director.name}</strong>
              <span>{director.designation}</span>
              <span>DIN: {director.din}</span>
            </div>)}
          </div>
          <small>Place: {settings.place}<br/>Date: {signingDate}</small>
        </>}
      </div>
      <div className="signature-column signature-ca">
        {settings.showCharteredAccountant && <>
          <p>{capacityHeading(settings.caCapacity)}</p>
          <span>For {settings.caFirmName}</span>
          <span>Chartered Accountants</span>
          {settings.caFirmRegistrationNumber && <span>Firm Registration No.: {settings.caFirmRegistrationNumber}</span>}
          <span className="signature-line">CA signature</span>
          <strong>{settings.caName}</strong>
          <span>{settings.caDesignation}</span>
          <span>Membership No.: {settings.caMembershipNumber}</span>
          {settings.caUdin && <span>UDIN: {settings.caUdin}</span>}
          <small>Place: {settings.place}<br/>Date: {signingDate}</small>
        </>}
      </div>
    </section>
  );
}

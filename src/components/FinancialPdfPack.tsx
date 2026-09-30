import { calculateRatioSchedule, formatRatioValue } from '../domain/ratios';
import { hasComparativeCashFlowSummary } from '../domain/cashFlowAvailability';
import { formatMoney } from '../domain/money';
import { buildNoteSchedule } from '../domain/noteSchedules';
import type { FinancialStatements, KpiSet, ReportLine, WorkspaceData } from '../domain/types';
import { StatementSignatures } from './StatementSignatures';
import { StatementTable } from './ui';

function ReportHeader({ workspace, label }: { workspace: WorkspaceData; label: string }) {
  return (
    <header className="pdf-report-header">
      <div><strong>WHITE HORSE</strong><span>Financial statement pack</span></div>
      <div><span>{workspace.company.legalName}</span><strong>{label}</strong></div>
    </header>
  );
}

function StatementPage({ workspace, title, lines }: { workspace: WorkspaceData; title: string; lines: ReportLine[] }) {
  const comparativeUnavailable = title === 'Cash Flow Statement' && !hasComparativeCashFlowSummary(workspace.period);
  const pageClassName = title === 'Balance Sheet'
    ? 'pdf-page pdf-statement-page pdf-balance-sheet-page'
    : 'pdf-page pdf-statement-page';

  return (
    <article className={pageClassName}>
      <ReportHeader workspace={workspace} label={title}/>
      <div className="statement-title pdf-statement-title">
        <p>{workspace.company.legalName}</p>
        <h2>{title}</h2>
        <span>for the year ended {new Date(`${workspace.period.endDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <small>Amounts in ₹ {workspace.company.displayScale.toLowerCase()}</small>
      </div>
      <StatementTable
        lines={lines}
        currentLabel={workspace.period.label}
        comparativeLabel={workspace.period.comparativeLabel}
        scale={workspace.company.displayScale}
        comparativeUnavailable={comparativeUnavailable}
      />
      {comparativeUnavailable && <p className="statement-comparative-note">Comparative cash-flow details were not supplied; amounts are unavailable rather than zero.</p>}
      <div className="pdf-statement-tail">
        <p>See accompanying notes forming part of these financial statements.</p>
        <StatementSignatures settings={workspace.period.signatureSettings}/>
      </div>
    </article>
  );
}

export function FinancialPdfPack({ workspace, statements, kpis }: { workspace: WorkspaceData; statements: FinancialStatements; kpis: KpiSet }) {
  const notes = [...workspace.notes].sort((left, right) => Number(left.noteNumber) - Number(right.noteNumber));
  const ratios = calculateRatioSchedule(statements, kpis);
  const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <section className="financial-pdf-pack">
      <article className="pdf-page pdf-cover-page">
        <div className="pdf-cover-brand"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt=""/><span>WHITE HORSE</span></div>
        <div className="pdf-cover-copy">
          <span>Complete financial statement pack</span>
          <h1>{workspace.company.legalName}</h1>
          <p>{workspace.period.label}</p>
        </div>
        <dl className="pdf-cover-details">
          <div><dt>CIN</dt><dd>{workspace.company.cin}</dd></div>
          <div><dt>Registered office</dt><dd>{workspace.company.registeredOffice}</dd></div>
          <div><dt>Framework</dt><dd>Schedule III Division I-oriented presentation</dd></div>
          <div><dt>Comparative period</dt><dd>{workspace.period.comparativeLabel}</dd></div>
          <div><dt>Period status</dt><dd>{workspace.period.status.replaceAll('_', ' ')}</dd></div>
          <div><dt>Generated</dt><dd>{generatedAt}</dd></div>
        </dl>
        <div className="pdf-cover-warning">
          <strong>{workspace.period.status === 'FINALISED' ? 'Finalised workspace output' : 'Draft for professional review'}</strong>
          <p>This pack automates presentation from the configured Trial Balance, mappings, adjustments and note workpapers. It is not an audit report, does not apply a handwritten or digital signature, and must be reviewed for all entity-specific legal, accounting-standard and Schedule III disclosures before use.</p>
        </div>
      </article>

      <StatementPage workspace={workspace} title="Balance Sheet" lines={statements.balanceSheet}/>
      <StatementPage workspace={workspace} title="Statement of Profit and Loss" lines={statements.profitAndLoss}/>
      <StatementPage workspace={workspace} title="Cash Flow Statement" lines={statements.cashFlow}/>

      <article className="pdf-page pdf-notes-page">
        <table className="pdf-notes-document">
          <thead><tr><td><ReportHeader workspace={workspace} label="Notes to Accounts"/></td></tr></thead>
          <tbody>
            <tr className="pdf-notes-intro-row"><td>
              <div className="pdf-section-title">
                <h2>Notes forming part of the financial statements</h2>
                <p>Schedule III, Division I-oriented presentation for {workspace.period.label}. Amounts are in ₹ {workspace.company.displayScale.toLowerCase()} unless otherwise stated.</p>
              </div>
              <aside className="pdf-notes-basis">
                <strong>Basis of these schedules</strong>
                <p>Amounts below are derived from the active Trial Balance, reviewed ledger mappings and posted adjustments. Disclosure workpapers such as the fixed-asset register, ageing schedules, share register and statutory registers remain subject to professional completion and review.</p>
              </aside>
            </td></tr>
            {notes.map((note) => {
            const schedule = buildNoteSchedule(note, workspace, statements);
            const narrativeRepeatsRequirement = note.narrative.trim() === schedule.completionRequirement?.trim();
            return (
              <tr className="pdf-note-row" key={note.id}><td><section className="pdf-note">
                <header>
                  <span>Note {note.noteNumber}</span>
                  <h3>{note.title}</h3>
                  <em className={`pdf-note-status status-${note.status.toLowerCase().replaceAll('_', '-')}`}>{note.status.replaceAll('_', ' ')}</em>
                </header>
                <div className={`pdf-note-auto auto-${schedule.automaticDisclosure.status.toLowerCase().replaceAll('_', '-')}`}>
                  <strong>Automatic company disclosure · {schedule.automaticDisclosure.status.replaceAll('_', ' ')}</strong>
                  {schedule.automaticDisclosure.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {schedule.rows.length > 0 && (
                  <table className="pdf-note-table">
                    <thead><tr><th>Particulars</th><th>{workspace.period.label}</th><th>{workspace.period.comparativeLabel}</th></tr></thead>
                    <tbody>
                      {schedule.rows.map((row) => (
                        <tr key={row.key}>
                          <td>{row.label}</td>
                          <td>{formatMoney(row.currentPaise, workspace.company.displayScale, { showZero: false })}</td>
                          <td>{formatMoney(row.comparativePaise, workspace.company.displayScale, { showZero: false })}</td>
                        </tr>
                      ))}
                      <tr className="pdf-note-total">
                        <td>Total</td>
                        <td>{formatMoney(schedule.totalCurrentPaise, workspace.company.displayScale)}</td>
                        <td>{formatMoney(schedule.totalComparativePaise, workspace.company.displayScale)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
                {schedule.movementRows && (
                  <div className="pdf-note-movement">
                    <h4>Net carrying amount reconciliation</h4>
                    <table>
                      <tbody>{schedule.movementRows.map((row) => <tr className={row.emphasis ? 'pdf-note-total' : ''} key={row.label}><td>{row.label}</td><td>{formatMoney(row.amountPaise, workspace.company.displayScale)}</td></tr>)}</tbody>
                    </table>
                    <p>{schedule.movementScope}</p>
                  </div>
                )}
                {note.narrative && !narrativeRepeatsRequirement && <div className="pdf-note-narrative"><strong>Entity-specific disclosure</strong><p>{note.narrative}</p></div>}
                {!note.narrative && <div className="pdf-note-narrative"><strong>Entity-specific disclosure</strong><p>Disclosure workpaper narrative has not been completed.</p></div>}
                {schedule.completionRequirement && (
                  <div className="pdf-note-requirement">
                    <strong>Professional completion requirement</strong>
                    <p>{schedule.completionRequirement}</p>
                  </div>
                )}
              </section></td></tr>
            );
            })}
          </tbody>
        </table>
      </article>

      <article className="pdf-page pdf-ratios-page">
        <ReportHeader workspace={workspace} label="Ratio schedule"/>
        <div className="pdf-section-title"><h2>Analytical ratio schedule</h2><p>Calculated from mapped statement balances; illustrative review ranges are not entity covenants.</p></div>
        <table className="pdf-ratio-table">
          <thead><tr><th>Ratio and formula</th><th>{workspace.period.label}</th><th>{workspace.period.comparativeLabel}</th><th>Review basis</th></tr></thead>
          <tbody>{ratios.map((ratio) => <tr key={ratio.name}><td><strong>{ratio.name}</strong><small>{ratio.formula}</small></td><td>{formatRatioValue(ratio.current, ratio.format)}</td><td>{formatRatioValue(ratio.comparative, ratio.format)}</td><td>{ratio.benchmark}</td></tr>)}</tbody>
        </table>
        <footer className="pdf-pack-footer"><p>Prepared using taxonomy {workspace.period.taxonomyVersion} and ruleset {workspace.period.rulesetVersion}.</p><p>End of financial statement pack</p></footer>
      </article>
    </section>
  );
}

import { calculateRatioSchedule, formatRatioValue } from '../domain/ratios';
import { formatMoney } from '../domain/money';
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
  return (
    <article className="pdf-page pdf-statement-page">
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
      />
      <div className="pdf-statement-tail">
        <p>See accompanying notes forming part of these financial statements.</p>
        <StatementSignatures settings={workspace.period.signatureSettings}/>
      </div>
    </article>
  );
}

export function FinancialPdfPack({ workspace, statements, kpis }: { workspace: WorkspaceData; statements: FinancialStatements; kpis: KpiSet }) {
  const statementLineByCode = new Map([...statements.balanceSheet, ...statements.profitAndLoss].map((line) => [line.code, line]));
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
        <ReportHeader workspace={workspace} label="Notes to Accounts"/>
        <div className="pdf-section-title"><h2>Notes to Accounts</h2><p>forming part of the financial statements for {workspace.period.label}</p></div>
        <div className="pdf-notes-list">
          {notes.map((note) => {
            const lines = note.taxonomyCodes.map((code) => statementLineByCode.get(code)).filter((line): line is ReportLine => Boolean(line));
            const current = lines.reduce((total, line) => total + line.currentPaise, 0);
            const comparative = lines.reduce((total, line) => total + line.comparativePaise, 0);
            return (
              <section className="pdf-note" key={note.id}>
                <header><span>Note {note.noteNumber}</span><h3>{note.title}</h3><em>{note.status.replaceAll('_', ' ')}</em></header>
                {note.taxonomyCodes.length > 0 && <div className="pdf-note-amounts"><span>{workspace.period.label}<strong>{formatMoney(current, workspace.company.displayScale)}</strong></span><span>{workspace.period.comparativeLabel}<strong>{formatMoney(comparative, workspace.company.displayScale)}</strong></span></div>}
                <p>{note.narrative || 'Disclosure workpaper narrative has not been completed.'}</p>
              </section>
            );
          })}
        </div>
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

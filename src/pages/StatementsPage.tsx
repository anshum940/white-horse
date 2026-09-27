import { useState } from 'react';
import { formatMoney } from '../domain/money';
import type { FinancialStatements, KpiSet, ReportLine, ValidationResult, WorkspaceData } from '../domain/types';
import { exportFinancialWorkbook } from '../services/excelExport';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatementTable, StatusBadge } from '../components/ui';

type StatementTab = 'balanceSheet' | 'profitAndLoss' | 'cashFlow';

export function StatementsPage({
  workspace,
  statements,
  kpis,
  validations,
  notify
}: {
  workspace: WorkspaceData;
  statements: FinancialStatements;
  kpis: KpiSet;
  validations: ValidationResult[];
  notify: (message: string, tone?: 'success' | 'error') => void;
}) {
  const [tab, setTab] = useState<StatementTab>('balanceSheet');
  const [drilldown, setDrilldown] = useState<ReportLine>();
  const [exporting, setExporting] = useState(false);
  const tabs: Array<{ key: StatementTab; label: string }> = [
    { key: 'balanceSheet', label: 'Balance Sheet' },
    { key: 'profitAndLoss', label: 'Profit & Loss' },
    { key: 'cashFlow', label: 'Cash Flow' }
  ];

  const adjustmentByLedger = new Map<string, number>();
  const posted = new Set(workspace.adjustments.filter((item) => item.status === 'POSTED').map((item) => item.id));
  for (const line of workspace.adjustmentLines) {
    if (!posted.has(line.adjustmentId)) continue;
    adjustmentByLedger.set(line.ledgerId, (adjustmentByLedger.get(line.ledgerId) ?? 0) + line.debitPaise - line.creditPaise);
  }

  async function exportWorkbook() {
    setExporting(true);
    try {
      await exportFinancialWorkbook(workspace, statements, kpis, validations);
      notify('Complete financial-statement workbook generated locally.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to generate workbook.', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page statement-page">
      <PageHeader
        eyebrow="Adjusted TB → financial statements"
        title="Financial statements"
        description="Schedule III Division I-oriented presentation with comparatives, note references and full ledger drill-down."
        actions={<><button className="button button-secondary" onClick={() => window.print()}><Icon name="print" size={16}/> Print / PDF</button><button className="button button-primary" disabled={exporting} onClick={() => void exportWorkbook()}><Icon name="download" size={16}/> {exporting ? 'Generating…' : 'Generate complete financials'}</button></>}
      />
      <section className="statement-control-bar">
        <div className="statement-tabs">{tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={tab === item.key ? 'active' : ''}>{item.label}</button>)}</div>
        <div className="statement-controls"><StatusBadge tone={workspace.period.status === 'FINALISED' ? 'green' : 'amber'}>{workspace.period.status === 'FINALISED' ? 'FINALISED' : 'DRAFT FOR REVIEW'}</StatusBadge><span>₹ in {workspace.company.displayScale.toLowerCase()}</span></div>
      </section>
      <section className="paper-sheet">
        <header className="report-header">
          <div className="report-brand"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt=""/><span>WHITE HORSE<small>Financial reporting workspace</small></span></div>
          <div className="report-meta"><span>Report run</span><strong>WH-{workspace.period.endDate.replaceAll('-', '')}-DRAFT</strong></div>
        </header>
        <div className="statement-title">
          <p>{workspace.company.legalName}</p>
          <h2>{tabs.find((item) => item.key === tab)?.label}</h2>
          <span>for the year ended {new Date(`${workspace.period.endDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <StatementTable
          lines={statements[tab]}
          currentLabel={workspace.period.label}
          comparativeLabel={workspace.period.comparativeLabel}
          scale={workspace.company.displayScale}
          onDrilldown={setDrilldown}
        />
        <footer className="report-footer-note">
          <p>See accompanying notes forming part of these financial statements.</p>
          <p>Prepared using taxonomy {workspace.period.taxonomyVersion}. {workspace.company.id === 'demo-company' ? 'Synthetic demonstration data — not for statutory filing.' : 'Subject to preparer/reviewer completion of all applicable disclosures.'}</p>
        </footer>
      </section>

      {drilldown && (
        <Modal title={drilldown.label} description="Trace from the presented figure to individual ledgers and posted adjustments." onClose={() => setDrilldown(undefined)} footer={<button className="button button-primary" onClick={() => setDrilldown(undefined)}>Done</button>}>
          <div className="drilldown-summary"><div><span>Presented amount</span><strong>{formatMoney(drilldown.currentPaise, workspace.company.displayScale)}</strong></div><div><span>Comparative</span><strong>{formatMoney(drilldown.comparativePaise, workspace.company.displayScale)}</strong></div><div><span>Source ledgers</span><strong>{drilldown.ledgerIds.length}</strong></div></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Ledger</th><th className="amount-column">Imported TB</th><th className="amount-column">Posted adjustment</th><th className="amount-column">Adjusted signed</th></tr></thead><tbody>{drilldown.ledgerIds.map((ledgerId) => {
            const ledger = workspace.ledgers.find((item) => item.id === ledgerId);
            if (!ledger) return null;
            const adjustment = adjustmentByLedger.get(ledgerId) ?? 0;
            return <tr key={ledgerId}><td><div className="ledger-cell"><span className="ledger-code">{ledger.code}</span><strong>{ledger.name}</strong></div></td><td className="amount-column">{formatMoney(ledger.signedCurrentPaise, workspace.company.displayScale)}</td><td className="amount-column">{formatMoney(adjustment, workspace.company.displayScale, { showZero: false })}</td><td className="amount-column"><strong>{formatMoney(ledger.signedCurrentPaise + adjustment, workspace.company.displayScale)}</strong></td></tr>;
          })}</tbody></table></div>
        </Modal>
      )}
    </div>
  );
}

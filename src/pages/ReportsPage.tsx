import { useState } from 'react';
import { formatMoney } from '../domain/money';
import type { FinancialStatements, KpiSet, ValidationResult, WorkspaceData } from '../domain/types';
import { exportFinancialWorkbook } from '../services/excelExport';
import { Icon } from '../components/Icon';
import { PageHeader, StatusBadge } from '../components/ui';

export function ReportsPage({ workspace, statements, kpis, validations, notify }: { workspace: WorkspaceData; statements: FinancialStatements; kpis: KpiSet; validations: ValidationResult[]; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [busy, setBusy] = useState(false);
  async function exportWorkbook() {
    setBusy(true);
    try {
      await exportFinancialWorkbook(workspace, statements, kpis, validations);
      notify('Financial statement workbook generated locally.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to generate workbook.', 'error');
    } finally {
      setBusy(false);
    }
  }
  const max = Math.max(kpis.revenue, kpis.comparativeRevenue);
  return (
    <div className="page reports-page">
      <PageHeader eyebrow="Stakeholder communication" title="Board & bank reports" description="Curated packs with approved figures, commentary, ratios and supporting schedules." actions={<button className="button button-primary" disabled={busy} onClick={() => void exportWorkbook()}><Icon name="download" size={16}/> {busy ? 'Generating…' : 'Export financial workbook'}</button>}/>
      <section className="report-pack-grid">
        <article className="pack-card pack-board">
          <div className="pack-visual"><span className="pack-brand">WHITE HORSE</span><div className="pack-title">Board<br/>Performance<br/>Pack</div><span className="pack-period">{workspace.period.label}</span><div className="pack-lines"><i/><i/><i/></div></div>
          <div className="pack-content"><div><StatusBadge tone="amber">DRAFT</StatusBadge><span>12 sections</span></div><h2>Board Performance Pack</h2><p>Executive summary, KPI trends, variance commentary, liquidity, leverage and condensed statements.</p><ul><li><Icon name="check" size={14}/> Management KPI dashboard</li><li><Icon name="check" size={14}/> Variance and movement analysis</li><li><Icon name="check" size={14}/> Review matters and decisions</li></ul><button className="button button-secondary" onClick={() => window.print()}><Icon name="eye" size={16}/> Preview & print</button></div>
        </article>
        <article className="pack-card pack-bank">
          <div className="pack-visual"><span className="pack-brand">WHITE HORSE</span><div className="pack-title">Bank<br/>Financial<br/>Information</div><span className="pack-period">{workspace.period.label}</span><div className="pack-lines"><i/><i/><i/></div></div>
          <div className="pack-content"><div><StatusBadge tone="amber">PROVISIONAL</StatusBadge><span>15 schedules</span></div><h2>Bank Financial Information Pack</h2><p>Financial statements, debt profile, working-capital analysis, coverage ratios and audit trail manifest.</p><ul><li><Icon name="check" size={14}/> Debt and security schedule</li><li><Icon name="check" size={14}/> Working-capital build-up</li><li><Icon name="check" size={14}/> Covenant and ratio analysis</li></ul><button className="button button-secondary" onClick={() => window.print()}><Icon name="eye" size={16}/> Preview & print</button></div>
        </article>
      </section>
      <section className="board-preview panel">
        <div className="panel-heading"><div><span className="panel-kicker">Board pack preview</span><h2>Performance at a glance</h2></div><StatusBadge tone="neutral">₹ in lakhs</StatusBadge></div>
        <div className="board-kpis"><div><span>Revenue</span><strong>{formatMoney(kpis.revenue, 'LAKHS')}</strong></div><div><span>EBITDA</span><strong>{formatMoney(kpis.ebitda, 'LAKHS')}</strong></div><div><span>PAT</span><strong>{formatMoney(kpis.profitAfterTax, 'LAKHS')}</strong></div><div><span>Net worth</span><strong>{formatMoney(kpis.netWorth, 'LAKHS')}</strong></div></div>
        <div className="board-chart">
          {[['Revenue', kpis.comparativeRevenue, kpis.revenue], ['EBITDA', kpis.comparativeEbitda, kpis.ebitda], ['PAT', kpis.comparativeProfitAfterTax, kpis.profitAfterTax]].map(([label, prior, current]) => <div className="board-chart-row" key={label as string}><strong>{label}</strong><div><span className="bar prior" style={{ width: `${((prior as number) / max) * 100}%` }}/><em>{formatMoney(prior as number, 'LAKHS')}</em></div><div><span className="bar current" style={{ width: `${((current as number) / max) * 100}%` }}/><em>{formatMoney(current as number, 'LAKHS')}</em></div></div>)}
        </div>
        <div className="board-commentary"><Icon name="info"/><div><strong>Draft management commentary</strong><p>Revenue grew 14.3% while EBITDA margin improved. Receivables increased faster than revenue and remain a focused collection action for the next quarter.</p></div></div>
      </section>
    </div>
  );
}

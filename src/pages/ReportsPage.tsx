import { useState } from 'react';
import { formatMoney, variancePercent } from '../domain/money';
import type { FinancialStatements, KpiSet, ValidationResult, WorkspaceData } from '../domain/types';
import { exportFinancialWorkbook } from '../services/excelExport';
import { Icon } from '../components/Icon';
import { PageHeader, StatusBadge } from '../components/ui';

export function ReportsPage({ workspace, statements, kpis, validations, notify }: { workspace: WorkspaceData; statements: FinancialStatements; kpis: KpiSet; validations: ValidationResult[]; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [busy, setBusy] = useState(false);
  const [packType, setPackType] = useState<'BOARD' | 'BANK'>('BOARD');
  async function exportWorkbook() {
    setBusy(true);
    try {
      await exportFinancialWorkbook(workspace, statements, kpis, validations);
      notify('Complete financial-statement pack generated locally.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to generate workbook.', 'error');
    } finally {
      setBusy(false);
    }
  }
  function printPack(type: 'BOARD' | 'BANK') {
    setPackType(type);
    window.setTimeout(() => window.print(), 0);
  }
  const max = Math.max(Math.abs(kpis.revenue), Math.abs(kpis.comparativeRevenue), 1);
  const revenueGrowth = variancePercent(kpis.revenue, kpis.comparativeRevenue);
  return (
    <div className="page reports-page">
      <PageHeader eyebrow="Stakeholder communication" title="Board & bank reports" description="Curated views backed by the complete statement, note, ratio and audit workbook." actions={<button className="button button-primary" disabled={busy} onClick={() => void exportWorkbook()}><Icon name="download" size={16}/> {busy ? 'Generating…' : 'Generate complete financials'}</button>}/>
      <section className="report-pack-grid">
        <article className="pack-card pack-board">
          <div className="pack-visual"><span className="pack-brand">WHITE HORSE</span><div className="pack-title">Board<br/>Performance<br/>Pack</div><span className="pack-period">{workspace.period.label}</span><div className="pack-lines"><i/><i/><i/></div></div>
          <div className="pack-content"><div><StatusBadge tone="amber">DRAFT</StatusBadge><span>Live calculated view</span></div><h2>Board Performance Pack</h2><p>Executive summary, KPI trends, variance commentary, liquidity, leverage and condensed statements.</p><ul><li><Icon name="check" size={14}/> Management KPI dashboard</li><li><Icon name="check" size={14}/> Variance and movement analysis</li><li><Icon name="check" size={14}/> Review matters and decisions</li></ul><button className="button button-secondary" onClick={() => printPack('BOARD')}><Icon name="eye" size={16}/> Preview & print</button></div>
        </article>
        <article className="pack-card pack-bank">
          <div className="pack-visual"><span className="pack-brand">WHITE HORSE</span><div className="pack-title">Bank<br/>Financial<br/>Information</div><span className="pack-period">{workspace.period.label}</span><div className="pack-lines"><i/><i/><i/></div></div>
          <div className="pack-content"><div><StatusBadge tone="amber">PROVISIONAL</StatusBadge><span>Live calculated view</span></div><h2>Bank Financial Information Pack</h2><p>Financial statements, debt profile, working-capital analysis, coverage ratios and audit trail manifest.</p><ul><li><Icon name="check" size={14}/> Debt and security schedule</li><li><Icon name="check" size={14}/> Working-capital build-up</li><li><Icon name="check" size={14}/> Covenant and ratio analysis</li></ul><button className="button button-secondary" onClick={() => printPack('BANK')}><Icon name="eye" size={16}/> Preview & print</button></div>
        </article>
      </section>
      <section className="board-preview panel">
        <div className="panel-heading"><div><span className="panel-kicker">{packType === 'BOARD' ? 'Board pack preview' : 'Bank pack preview'}</span><h2>{packType === 'BOARD' ? 'Performance at a glance' : 'Funding and coverage at a glance'}</h2></div><StatusBadge tone="neutral">₹ in {workspace.company.displayScale.toLowerCase()}</StatusBadge></div>
        <div className="board-kpis">{(packType === 'BOARD' ? [['Revenue', kpis.revenue], ['EBITDA', kpis.ebitda], ['PAT', kpis.profitAfterTax], ['Net worth', kpis.netWorth]] : [['Total debt', kpis.totalDebt], ['Working capital', kpis.workingCapital], ['Net worth', kpis.netWorth], ['PAT', kpis.profitAfterTax]]).map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{formatMoney(value as number, workspace.company.displayScale)}</strong></div>)}</div>
        <div className="board-chart">
          {[['Revenue', kpis.comparativeRevenue, kpis.revenue], ['EBITDA', kpis.comparativeEbitda, kpis.ebitda], ['PAT', kpis.comparativeProfitAfterTax, kpis.profitAfterTax]].map(([label, prior, current]) => <div className="board-chart-row" key={label as string}><strong>{label}</strong><div><span className="bar prior" style={{ width: `${((prior as number) / max) * 100}%` }}/><em>{formatMoney(prior as number, workspace.company.displayScale)}</em></div><div><span className="bar current" style={{ width: `${((current as number) / max) * 100}%` }}/><em>{formatMoney(current as number, workspace.company.displayScale)}</em></div></div>)}
        </div>
        <div className="board-commentary"><Icon name="info"/><div><strong>Draft management commentary</strong><p>{packType === 'BOARD' ? `Revenue ${revenueGrowth === null ? 'has no comparable base' : `${revenueGrowth >= 0 ? 'increased' : 'decreased'} ${Math.abs(revenueGrowth).toFixed(1)}%`} and profit after tax is ${formatMoney(kpis.profitAfterTax, workspace.company.displayScale)}. Add entity-approved operational commentary before circulation.` : `Total debt is ${formatMoney(kpis.totalDebt, workspace.company.displayScale)}, working capital is ${formatMoney(kpis.workingCapital, workspace.company.displayScale)} and interest coverage is ${kpis.interestCoverage === null ? 'N/A' : `${kpis.interestCoverage.toFixed(2)}x`}. Confirm lender definitions and covenant calculations before circulation.`}</p></div></div>
      </section>
    </div>
  );
}

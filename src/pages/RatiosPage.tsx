import { formatMoney, safeRatio } from '../domain/money';
import { calculateRatioSchedule, formatRatioValue } from '../domain/ratios';
import type { FinancialStatements, KpiSet, WorkspaceData } from '../domain/types';
import { downloadRatioScheduleCsv } from '../services/ratioExport';
import { Icon } from '../components/Icon';
import { PageHeader, StatusBadge } from '../components/ui';

export function RatiosPage({ workspace, statements, kpis, notify }: { workspace: WorkspaceData; statements: FinancialStatements; kpis: KpiSet; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const avgWorkingCapital = (kpis.workingCapital + kpis.comparativeWorkingCapital) / 2;
  const rows = calculateRatioSchedule(statements, kpis);

  function exportSchedule() {
    try {
      downloadRatioScheduleCsv(rows, workspace.period.label, workspace.period.comparativeLabel, `WhiteHorse_${workspace.company.tradeName}_${workspace.period.endDate}_Ratios`);
      notify('Complete ratio schedule exported as CSV.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to export the ratio schedule.', 'error');
    }
  }
  return (
    <div className="page">
      <PageHeader eyebrow="Analytical review" title="Ratios & performance" description="Transparent formulas, source values and comparative movements for Schedule III and management review." actions={<button className="button button-secondary" onClick={exportSchedule}><Icon name="download" size={16}/> Export ratio schedule</button>}/>
      <section className="ratio-hero-grid">
        <article className="panel ratio-feature"><span>Profitability</span><h2>{formatRatioValue(safeRatio(kpis.profitAfterTax, kpis.revenue), '%')}</h2><p>Net profit ratio</p><div className="feature-trend positive"><Icon name="arrow-up" size={14}/> {((safeRatio(kpis.profitAfterTax, kpis.revenue) ?? 0) * 100 - (safeRatio(kpis.comparativeProfitAfterTax, kpis.comparativeRevenue) ?? 0) * 100).toFixed(2)} pp</div></article>
        <article className="panel ratio-feature"><span>Liquidity</span><h2>{formatRatioValue(kpis.currentRatio, 'x')}</h2><p>Current ratio</p><div className="feature-trend positive"><Icon name="check" size={14}/> Review against entity policy</div></article>
        <article className="panel ratio-feature"><span>Leverage</span><h2>{formatRatioValue(kpis.debtEquityRatio, 'x')}</h2><p>Debt–equity ratio</p><div className="feature-trend positive"><Icon name="arrow-down" size={14}/> Comparative movement calculated</div></article>
        <article className="panel ratio-feature"><span>Returns</span><h2>{formatRatioValue(kpis.roce, '%')}</h2><p>Return on capital employed</p><div className="feature-trend positive"><Icon name="arrow-up" size={14}/> Review against entity policy</div></article>
      </section>
      <section className="panel ratio-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">Required and management ratios</span><h2>Analytical ratio schedule</h2></div><StatusBadge tone="amber">1 explanation pending</StatusBadge></div>
        <div className="table-scroll"><table className="data-table ratio-table"><thead><tr><th>Ratio and formula</th><th className="amount-column">{workspace.period.label}</th><th className="amount-column">{workspace.period.comparativeLabel}</th><th>Movement</th><th>Benchmark / status</th></tr></thead><tbody>{rows.map((row) => {
          const movement = row.current !== null && row.comparative !== null ? row.current - row.comparative : null;
          return <tr key={row.name}><td><strong>{row.name}</strong><small>{row.formula}</small></td><td className="amount-column"><strong>{formatRatioValue(row.current, row.format)}</strong></td><td className="amount-column">{formatRatioValue(row.comparative, row.format)}</td><td><span className={movement !== null && movement >= 0 ? 'positive' : 'negative'}>{movement === null ? 'N/A' : `${movement >= 0 ? '+' : ''}${row.format === '%' ? (movement * 100).toFixed(2) + ' pp' : movement.toFixed(2) + 'x'}`}</span></td><td><StatusBadge tone={row.withinRange ? 'green' : 'amber'}>{row.withinRange === null ? 'INPUT REQUIRED' : row.withinRange ? 'WITHIN RANGE' : 'REVIEW'}</StatusBadge><small>{row.benchmark}</small></td></tr>;
        })}</tbody></table></div>
      </section>
      <section className="ratio-basis panel"><Icon name="info"/><div><strong>Formula basis and limitations</strong><p>Ratios use adjusted current-year figures and available comparative balances. A zero or unavailable denominator is shown as N/A—not zero. Purchases are approximated by material cost in the payable-turnover ratio and must be configured to the entity’s policy before final use. Debt-service coverage remains N/A until principal repayments are captured.</p><span>Revenue {formatMoney(kpis.revenue, workspace.company.displayScale)} · Average working capital {formatMoney(avgWorkingCapital, workspace.company.displayScale)}</span></div></section>
    </div>
  );
}

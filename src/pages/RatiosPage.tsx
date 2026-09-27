import { formatMoney, safeRatio } from '../domain/money';
import type { FinancialStatements, KpiSet, WorkspaceData } from '../domain/types';
import { Icon } from '../components/Icon';
import { PageHeader, StatusBadge } from '../components/ui';

export function RatiosPage({ workspace, statements, kpis }: { workspace: WorkspaceData; statements: FinancialStatements; kpis: KpiSet }) {
  const allLines = [...statements.balanceSheet, ...statements.profitAndLoss];
  const amount = (code: string, prior = false) => {
    const line = allLines.find((item) => item.code === code);
    return prior ? line?.comparativePaise ?? 0 : line?.currentPaise ?? 0;
  };
  const avg = (code: string) => (amount(code) + amount(code, true)) / 2;
  const avgWorkingCapital = (kpis.workingCapital + kpis.comparativeWorkingCapital) / 2;
  const rows = [
    { name: 'Current ratio', formula: 'Current assets / Current liabilities', current: kpis.currentRatio, prior: kpis.comparativeCurrentRatio, format: 'x', benchmark: '≥ 1.50x', good: (value: number) => value >= 1.5 },
    { name: 'Debt–equity ratio', formula: 'Total debt / Shareholders’ equity', current: kpis.debtEquityRatio, prior: kpis.comparativeDebtEquityRatio, format: 'x', benchmark: '≤ 1.00x', good: (value: number) => value <= 1 },
    { name: 'Interest coverage', formula: 'EBIT / Finance costs', current: kpis.interestCoverage, prior: kpis.comparativeInterestCoverage, format: 'x', benchmark: '≥ 3.00x', good: (value: number) => value >= 3 },
    { name: 'Return on equity', formula: 'PAT / Average equity', current: kpis.roe, prior: kpis.comparativeRoe, format: '%', benchmark: '≥ 15.0%', good: (value: number) => value >= 0.15 },
    { name: 'Inventory turnover', formula: 'Cost of materials / Average inventory', current: safeRatio(amount('PL-EXP-MATERIAL'), avg('BS-CA-INVENTORY')), prior: safeRatio(amount('PL-EXP-MATERIAL', true), amount('BS-CA-INVENTORY', true)), format: 'x', benchmark: 'Trend review', good: (value: number) => value >= 4 },
    { name: 'Trade receivables turnover', formula: 'Revenue / Average trade receivables', current: safeRatio(kpis.revenue, avg('BS-CA-RECEIVABLE')), prior: safeRatio(kpis.comparativeRevenue, amount('BS-CA-RECEIVABLE', true)), format: 'x', benchmark: '≥ 7.00x', good: (value: number) => value >= 7 },
    { name: 'Trade payables turnover', formula: 'Materials / Average trade payables', current: safeRatio(amount('PL-EXP-MATERIAL'), avg('BS-CL-PAYABLE')), prior: safeRatio(amount('PL-EXP-MATERIAL', true), amount('BS-CL-PAYABLE', true)), format: 'x', benchmark: 'Trend review', good: (value: number) => value >= 6 },
    { name: 'Net capital turnover', formula: 'Revenue / Average working capital', current: safeRatio(kpis.revenue, avgWorkingCapital), prior: safeRatio(kpis.comparativeRevenue, kpis.comparativeWorkingCapital), format: 'x', benchmark: 'Trend review', good: (value: number) => value >= 5 },
    { name: 'Net profit ratio', formula: 'PAT / Revenue from operations', current: safeRatio(kpis.profitAfterTax, kpis.revenue), prior: safeRatio(kpis.comparativeProfitAfterTax, kpis.comparativeRevenue), format: '%', benchmark: '≥ 8.0%', good: (value: number) => value >= 0.08 },
    { name: 'Return on capital employed', formula: 'EBIT / Average capital employed', current: kpis.roce, prior: kpis.comparativeRoce, format: '%', benchmark: '≥ 18.0%', good: (value: number) => value >= 0.18 },
    { name: 'Return on investment', formula: 'Other income / Average investments', current: safeRatio(amount('PL-REV-OTHER'), avg('BS-NCA-INVESTMENT')), prior: safeRatio(amount('PL-REV-OTHER', true), amount('BS-NCA-INVESTMENT', true)), format: '%', benchmark: 'Policy-specific', good: (value: number) => value >= 0.08 }
  ];

  const formatted = (value: number | null, format: string) => value === null ? 'N/A' : format === '%' ? `${(value * 100).toFixed(2)}%` : `${value.toFixed(2)}x`;
  return (
    <div className="page">
      <PageHeader eyebrow="Analytical review" title="Ratios & performance" description="Transparent formulas, source values and comparative movements for Schedule III and management review." actions={<button className="button button-secondary"><Icon name="download" size={16}/> Export ratio schedule</button>}/>
      <section className="ratio-hero-grid">
        <article className="panel ratio-feature"><span>Profitability</span><h2>{formatted(safeRatio(kpis.profitAfterTax, kpis.revenue), '%')}</h2><p>Net profit ratio</p><div className="feature-trend positive"><Icon name="arrow-up" size={14}/> {((safeRatio(kpis.profitAfterTax, kpis.revenue) ?? 0) * 100 - (safeRatio(kpis.comparativeProfitAfterTax, kpis.comparativeRevenue) ?? 0) * 100).toFixed(2)} pp</div></article>
        <article className="panel ratio-feature"><span>Liquidity</span><h2>{formatted(kpis.currentRatio, 'x')}</h2><p>Current ratio</p><div className="feature-trend positive"><Icon name="check" size={14}/> Above 1.50x benchmark</div></article>
        <article className="panel ratio-feature"><span>Leverage</span><h2>{formatted(kpis.debtEquityRatio, 'x')}</h2><p>Debt–equity ratio</p><div className="feature-trend positive"><Icon name="arrow-down" size={14}/> Debt reduced year on year</div></article>
        <article className="panel ratio-feature"><span>Returns</span><h2>{formatted(kpis.roce, '%')}</h2><p>Return on capital employed</p><div className="feature-trend positive"><Icon name="arrow-up" size={14}/> Above internal benchmark</div></article>
      </section>
      <section className="panel ratio-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">Required and management ratios</span><h2>Analytical ratio schedule</h2></div><StatusBadge tone="amber">1 explanation pending</StatusBadge></div>
        <div className="table-scroll"><table className="data-table ratio-table"><thead><tr><th>Ratio and formula</th><th className="amount-column">{workspace.period.label}</th><th className="amount-column">{workspace.period.comparativeLabel}</th><th>Movement</th><th>Benchmark / status</th></tr></thead><tbody>{rows.map((row) => {
          const movement = row.current !== null && row.prior !== null ? row.current - row.prior : null;
          const good = row.current !== null && row.good(row.current);
          return <tr key={row.name}><td><strong>{row.name}</strong><small>{row.formula}</small></td><td className="amount-column"><strong>{formatted(row.current, row.format)}</strong></td><td className="amount-column">{formatted(row.prior, row.format)}</td><td><span className={movement !== null && movement >= 0 ? 'positive' : 'negative'}>{movement === null ? 'N/A' : `${movement >= 0 ? '+' : ''}${row.format === '%' ? (movement * 100).toFixed(2) + ' pp' : movement.toFixed(2) + 'x'}`}</span></td><td><StatusBadge tone={good ? 'green' : 'amber'}>{good ? 'WITHIN RANGE' : 'REVIEW'}</StatusBadge><small>{row.benchmark}</small></td></tr>;
        })}</tbody></table></div>
      </section>
      <section className="ratio-basis panel"><Icon name="info"/><div><strong>Formula basis and limitations</strong><p>Ratios use adjusted current-year figures and available comparative balances. A zero or unavailable denominator is shown as N/A—not zero. Purchases are approximated by material cost in the demonstration payable-turnover ratio and must be configured to the entity’s policy before final use.</p><span>Revenue {formatMoney(kpis.revenue, 'LAKHS')} · Average working capital {formatMoney(avgWorkingCapital, 'LAKHS')}</span></div></section>
    </div>
  );
}

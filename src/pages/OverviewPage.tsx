import { formatMoney, variancePercent } from '../domain/money';
import type { FinancialStatements, KpiSet, ValidationResult, WorkspaceData } from '../domain/types';
import { ragStatus } from '../domain/validation';
import { Icon } from '../components/Icon';
import { MetricCard, PageHeader, ProgressBar, StatusBadge, TrendBars } from '../components/ui';

export function OverviewPage({
  workspace,
  statements,
  kpis,
  validations,
  navigate
}: {
  workspace: WorkspaceData;
  statements: FinancialStatements;
  kpis: KpiSet;
  validations: ValidationResult[];
  navigate: (page: string) => void;
}) {
  const rag = ragStatus(validations);
  const openWarnings = validations.filter((result) => result.status === 'OPEN' && result.severity === 'WARNING').length;
  const openErrors = validations.filter(
    (result) => result.status === 'OPEN' && (result.severity === 'BLOCKING' || result.severity === 'ERROR')
  ).length;
  const mapped = workspace.mappings.filter((mapping) => mapping.taxonomyCode).length;
  const mappingPercent = workspace.ledgers.length ? (mapped / workspace.ledgers.length) * 100 : 0;
  const notePercent = workspace.notes.length
    ? (workspace.notes.filter((note) => note.status === 'COMPLETE').length / workspace.notes.length) * 100
    : 0;
  const workflow = [
    { label: 'Trial Balance', detail: `${workspace.ledgers.length} ledgers · balanced`, status: 'complete' },
    { label: 'Mapping', detail: `${mapped}/${workspace.ledgers.length} mapped`, status: mappingPercent === 100 ? 'complete' : 'active' },
    { label: 'Adjustments', detail: `${workspace.adjustments.filter((item) => item.status === 'POSTED').length} posted · ${workspace.adjustments.filter((item) => item.status === 'SUBMITTED').length} pending`, status: 'active' },
    { label: 'Disclosures', detail: `${Math.round(notePercent)}% complete`, status: notePercent === 100 ? 'complete' : 'active' },
    { label: 'Final review', detail: openErrors ? `${openErrors} blocking/error` : `${openWarnings} open warning`, status: openErrors ? 'blocked' : 'pending' }
  ];

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow="Financial close workspace"
        title={`Good morning, Aarav`}
        description={`Here is the preparation status for ${workspace.company.tradeName} · ${workspace.period.label}.`}
        actions={
          <button className="button button-primary" onClick={() => navigate('review')}>
            Continue review <Icon name="arrow-right" size={16} />
          </button>
        }
      />

      <section className="readiness-banner">
        <div className={`readiness-mark rag-${rag.toLowerCase()}`}>
          <Icon name={rag === 'GREEN' ? 'check' : rag === 'AMBER' ? 'warning' : 'error'} size={24} />
        </div>
        <div className="readiness-copy">
          <div className="readiness-title-row">
            <h2>{openErrors ? 'Preparation requires correction' : 'Financial statements ready for review'}</h2>
            <StatusBadge tone={rag === 'GREEN' ? 'green' : rag === 'AMBER' ? 'amber' : 'red'}>{rag}</StatusBadge>
          </div>
          <p>
            {openErrors
              ? `${openErrors} blocking or error result${openErrors === 1 ? '' : 's'} must be cleared before finalisation.`
              : `Core reconciliations pass in paise. ${openWarnings} open review warning${openWarnings === 1 ? ' remains' : 's remain'} before finalisation.`}
          </p>
        </div>
        <div className="readiness-stats">
          <div><span>BS difference</span><strong>{formatMoney(statements.totals.balanceSheetDifference, 'RUPEES')}</strong></div>
          <div><span>Cash-flow difference</span><strong>{formatMoney(statements.totals.cashFlowDifference, 'RUPEES')}</strong></div>
          <div><span>Last updated</span><strong>18 Apr, 4:00 PM</strong></div>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Revenue" value={kpis.revenue} comparative={kpis.comparativeRevenue} icon="reports" tone="emerald" />
        <MetricCard label="EBITDA" value={kpis.ebitda} comparative={kpis.comparativeEbitda} icon="ratios" tone="sand" />
        <MetricCard label="Profit after tax" value={kpis.profitAfterTax} comparative={kpis.comparativeProfitAfterTax} icon="statements" />
        <MetricCard label="Net worth" value={kpis.netWorth} comparative={kpis.comparativeNetWorth} icon="shield" />
        <MetricCard label="Total debt" value={kpis.totalDebt} comparative={kpis.comparativeTotalDebt} icon="company" tone="rose" />
        <MetricCard label="Working capital" value={kpis.workingCapital} comparative={kpis.comparativeWorkingCapital} icon="trial-balance" />
      </section>

      <section className="overview-grid">
        <article className="panel financial-performance">
          <div className="panel-heading">
            <div><span className="panel-kicker">Year-on-year</span><h2>Financial performance</h2></div>
            <StatusBadge tone="neutral">₹ in lakhs</StatusBadge>
          </div>
          <div className="performance-content">
            <TrendBars current={kpis.revenue} comparative={kpis.comparativeRevenue} labels={['FY 24–25', 'FY 25–26']} />
            <div className="performance-list">
              {[
                ['Revenue', kpis.revenue, kpis.comparativeRevenue],
                ['EBITDA', kpis.ebitda, kpis.comparativeEbitda],
                ['EBIT', kpis.ebit, kpis.comparativeEbit],
                ['PAT', kpis.profitAfterTax, kpis.comparativeProfitAfterTax]
              ].map(([label, current, prior]) => {
                const variance = variancePercent(current as number, prior as number) ?? 0;
                return (
                  <div className="performance-row" key={label as string}>
                    <span>{label}</span>
                    <strong>{formatMoney(current as number, 'LAKHS')}</strong>
                    <em className={variance >= 0 ? 'positive' : 'negative'}>{variance >= 0 ? '+' : ''}{variance.toFixed(1)}%</em>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="panel workflow-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Close progress</span><h2>Preparation workflow</h2></div>
            <strong className="workflow-score">82%</strong>
          </div>
          <ProgressBar value={82} />
          <ol className="workflow-list">
            {workflow.map((item, index) => (
              <li key={item.label} className={`workflow-${item.status}`}>
                <span className="workflow-index">{item.status === 'complete' ? <Icon name="check" size={14} /> : index + 1}</span>
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                <Icon name="chevron" size={15} />
              </li>
            ))}
          </ol>
        </article>

        <article className="panel ratios-snapshot">
          <div className="panel-heading">
            <div><span className="panel-kicker">Key controls</span><h2>Ratio snapshot</h2></div>
            <button className="text-button" onClick={() => navigate('ratios')}>View all <Icon name="arrow-right" size={14}/></button>
          </div>
          <div className="ratio-mini-grid">
            {[
              ['Current ratio', kpis.currentRatio, 'x', 1.5],
              ['Debt / equity', kpis.debtEquityRatio, 'x', 1],
              ['Interest cover', kpis.interestCoverage, 'x', 3],
              ['ROCE', kpis.roce === null ? null : kpis.roce * 100, '%', 20]
            ].map(([label, value, suffix, benchmark]) => {
              const number = value as number | null;
              const good = number !== null && (label === 'Debt / equity' ? number <= (benchmark as number) : number >= (benchmark as number));
              return (
                <div className="ratio-mini" key={label as string}>
                  <span>{label}</span>
                  <strong>{number === null ? 'N/A' : `${number.toFixed(2)}${suffix}`}</strong>
                  <small className={good ? 'positive' : 'neutral'}>{good ? 'Within benchmark' : 'Review trend'}</small>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel attention-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Review queue</span><h2>Needs attention</h2></div>
            <span className="attention-count">{validations.filter((item) => item.status === 'OPEN').length}</span>
          </div>
          <div className="attention-list">
            {validations.filter((item) => item.status === 'OPEN').slice(0, 3).map((item) => (
              <button key={item.id} onClick={() => navigate('review')}>
                <span className={`attention-icon severity-${item.severity.toLowerCase()}`}><Icon name={item.severity === 'INFO' ? 'info' : 'warning'} size={16}/></span>
                <span><strong>{item.title}</strong><small>{item.ruleId} · {item.suggestedAction}</small></span>
                <Icon name="chevron" size={15}/>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { recordValidationRun, resolveValidation } from '../db';
import { formatMoney } from '../domain/money';
import type { FinancialStatements, Severity, ValidationResult, WorkspaceData } from '../domain/types';
import { ragStatus, severityRank } from '../domain/validation';
import { Icon } from '../components/Icon';
import { PageHeader, SeverityBadge, StatusBadge } from '../components/ui';

export function ReviewPage({
  workspace,
  statements,
  validations,
  notify,
  navigate
}: {
  workspace: WorkspaceData;
  statements: FinancialStatements;
  validations: ValidationResult[];
  notify: (message: string, tone?: 'success' | 'error') => void;
  navigate: (page: string) => void;
}) {
  const [severity, setSeverity] = useState<'ALL' | Severity>('ALL');
  const [showResolved, setShowResolved] = useState(false);
  const [busy, setBusy] = useState<string>();
  const sorted = useMemo(
    () => [...validations]
      .filter((item) => severity === 'ALL' || item.severity === severity)
      .filter((item) => showResolved || item.status === 'OPEN')
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity)),
    [validations, severity, showResolved]
  );
  const rag = ragStatus(validations);
  const counts = (level: Severity) => validations.filter((item) => item.severity === level && item.status === 'OPEN').length;
  const persistedIds = new Set(workspace.validations.map((item) => item.id));

  async function markResolved(result: ValidationResult) {
    if (!persistedIds.has(result.id)) {
      notify('This automated result clears only when its source item is corrected.', 'error');
      return;
    }
    setBusy(result.id);
    try {
      await resolveValidation(result.id, 'Reviewed against supporting workpaper and marked resolved in the local workspace.');
      notify('Validation result resolved with reviewer audit trail.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to resolve result.', 'error');
    } finally {
      setBusy(undefined);
    }
  }

  async function runValidations() {
    setBusy('suite');
    try {
      await recordValidationRun(workspace.company.id, workspace.period.id, validations.length);
      notify(`Validation suite completed: ${validations.length} result${validations.length === 1 ? '' : 's'} generated from the current workspace.`, 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to record the validation run.', 'error');
    } finally {
      setBusy(undefined);
    }
  }

  const reconciliations = [
    { label: 'Trial Balance', value: workspace.activeImport.differencePaise, passed: workspace.activeImport.differencePaise === 0 },
    { label: 'Balance Sheet', value: statements.totals.balanceSheetDifference, passed: statements.totals.balanceSheetDifference === 0 },
    { label: 'Cash Flow', value: statements.totals.cashFlowDifference, passed: statements.totals.cashFlowDifference === 0 },
    { label: 'Comparative Balance Sheet', value: statements.totals.comparativeBalanceSheetDifference, passed: statements.totals.comparativeBalanceSheetDifference === 0 }
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Automated controls + professional review" title="Review & validation" description={`Ruleset ${workspace.period.rulesetVersion} · latest run reflects the current TB, mapping and posted adjustments.`} actions={<button className="button button-primary" disabled={busy === 'suite'} onClick={() => void runValidations()}><Icon name="review" size={16}/> {busy === 'suite' ? 'Running…' : 'Run all validations'}</button>}/>

      <section className="review-hero">
        <div className={`rag-card rag-card-${rag.toLowerCase()}`}>
          <span className="rag-letter">{rag.charAt(0)}</span>
          <div><span>Overall review status</span><h2>{rag === 'GREEN' ? 'Ready' : rag === 'AMBER' ? 'Attention required' : 'Correction required'}</h2><p>{rag === 'AMBER' ? 'Core reconciliations pass; open review matters remain.' : rag === 'GREEN' ? 'No open blocking, error or warning results.' : 'Blocking or error results must be corrected.'}</p></div>
        </div>
        <div className="review-counts">
          <button onClick={() => setSeverity('BLOCKING')}><span className="count-dot red"/><strong>{counts('BLOCKING')}</strong><small>Blocking</small></button>
          <button onClick={() => setSeverity('ERROR')}><span className="count-dot red"/><strong>{counts('ERROR')}</strong><small>Errors</small></button>
          <button onClick={() => setSeverity('WARNING')}><span className="count-dot amber"/><strong>{counts('WARNING')}</strong><small>Warnings</small></button>
          <button onClick={() => setSeverity('INFO')}><span className="count-dot blue"/><strong>{counts('INFO')}</strong><small>Information</small></button>
        </div>
      </section>

      <section className="reconciliation-grid">
        {reconciliations.map((item) => <article key={item.label}><span className={item.passed ? 'recon-icon pass' : 'recon-icon fail'}><Icon name={item.passed ? 'check' : 'error'} size={16}/></span><div><strong>{item.label}</strong><small>{item.passed ? 'Reconciled in paise' : 'Difference requires correction'}</small></div><em>{formatMoney(item.value, 'RUPEES')}</em></article>)}
      </section>

      <section className="panel validation-panel">
        <div className="table-toolbar">
          <div className="segmented-control">
            {(['ALL', 'BLOCKING', 'ERROR', 'WARNING', 'INFO'] as const).map((item) => <button key={item} onClick={() => setSeverity(item)} className={severity === item ? 'active' : ''}>{item === 'ALL' ? 'All results' : item.charAt(0) + item.slice(1).toLowerCase()}</button>)}
          </div>
          <label className="toggle-label"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)}/><span>Show resolved</span></label>
        </div>
        <div className="validation-list">
          {sorted.map((result) => (
            <article key={result.id} className={`validation-item validation-${result.severity.toLowerCase()}`}>
              <span className="validation-icon"><Icon name={result.severity === 'INFO' ? 'info' : result.severity === 'WARNING' ? 'warning' : 'error'} size={18}/></span>
              <div className="validation-content">
                <div className="validation-title"><SeverityBadge severity={result.severity}/><code>{result.ruleId}</code><h3>{result.title}</h3>{result.status !== 'OPEN' && <StatusBadge tone="green">{result.status}</StatusBadge>}</div>
                <p>{result.message}</p>
                <div className="validation-evidence"><strong>Evidence</strong><span>{result.evidence}</span></div>
                <div className="validation-action"><strong>Suggested action</strong><span>{result.suggestedAction}</span></div>
                {result.resolution && <div className="resolution-note"><Icon name="check" size={14}/><span>{result.resolution}</span></div>}
              </div>
              {result.status === 'OPEN' && <div className="validation-buttons"><button className="button button-secondary" onClick={() => navigate(result.entityType === 'ADJUSTMENT' ? 'adjustments' : result.entityType === 'NOTE' ? 'notes' : 'mapping')}>Open source</button><button className="button button-primary" disabled={busy === result.id} onClick={() => void markResolved(result)}>Mark reviewed</button></div>}
            </article>
          ))}
          {sorted.length === 0 && <div className="empty-list"><Icon name="check" size={24}/><h3>No results in this view</h3><p>Adjust the filters or run the validation suite again.</p></div>}
        </div>
      </section>
    </div>
  );
}

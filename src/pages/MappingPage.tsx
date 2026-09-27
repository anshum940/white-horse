import { useMemo, useState } from 'react';
import { taxonomyByCode, taxonomyOptions } from '../data/taxonomy';
import { updateMapping } from '../db';
import { formatMoney } from '../domain/money';
import type { WorkspaceData } from '../domain/types';
import { Icon } from '../components/Icon';
import { PageHeader, ProgressBar, StatusBadge } from '../components/ui';

export function MappingPage({ workspace, notify }: { workspace: WorkspaceData; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNMAPPED' | 'DRAFT' | 'LOCKED'>('ALL');
  const [busyId, setBusyId] = useState<string>();
  const mappingByLedger = useMemo(() => new Map(workspace.mappings.map((mapping) => [mapping.ledgerId, mapping])), [workspace.mappings]);
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workspace.ledgers.filter((ledger) => {
      const mapping = mappingByLedger.get(ledger.id);
      const matchesSearch = !query || `${ledger.code} ${ledger.name} ${mapping?.taxonomyCode ?? ''}`.toLowerCase().includes(query);
      const matchesFilter = filter === 'ALL' || (filter === 'UNMAPPED' ? !mapping : mapping?.status === filter);
      return matchesSearch && matchesFilter;
    });
  }, [workspace.ledgers, mappingByLedger, search, filter]);
  const mapped = workspace.ledgers.filter((ledger) => mappingByLedger.has(ledger.id)).length;
  const locked = workspace.mappings.filter((mapping) => mapping.status === 'LOCKED').length;
  const completion = workspace.ledgers.length ? (mapped / workspace.ledgers.length) * 100 : 0;

  async function changeMapping(ledgerId: string, taxonomyCode: string) {
    setBusyId(ledgerId);
    try {
      await updateMapping(ledgerId, taxonomyCode);
      notify('Mapping updated as a draft. Reviewer approval is required.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to update mapping.', 'error');
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Classification engine"
        title="Mapping & classification"
        description="Map every ledger to a controlled statement head, note and cash-flow class. Suggestions never approve themselves."
        actions={<button className="button button-primary" disabled={completion < 100}><Icon name="lock" size={16}/> Submit mapping version</button>}
      />

      <section className="mapping-summary">
        <div><span className="summary-icon"><Icon name="mapping"/></span><div><strong>{mapped} of {workspace.ledgers.length}</strong><small>Ledgers mapped</small></div></div>
        <div><span className="summary-icon"><Icon name="lock"/></span><div><strong>{locked}</strong><small>Locked mappings</small></div></div>
        <div><span className="summary-icon amber"><Icon name="warning"/></span><div><strong>{workspace.ledgers.length - mapped}</strong><small>Require classification</small></div></div>
        <div className="mapping-progress"><div><span>Completion</span><strong>{Math.round(completion)}%</strong></div><ProgressBar value={completion} tone={completion === 100 ? 'green' : 'amber'}/></div>
      </section>

      <section className="panel data-panel">
        <div className="table-toolbar mapping-toolbar">
          <div className="search-field"><Icon name="search" size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ledger or mapped head…"/></div>
          <div className="segmented-control" aria-label="Mapping filter">
            {(['ALL', 'UNMAPPED', 'DRAFT', 'LOCKED'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}</button>)}
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table mapping-table">
            <thead><tr><th>Ledger and balance</th><th>Statement head</th><th>Classification</th><th>Confidence / history</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((ledger) => {
                const mapping = mappingByLedger.get(ledger.id);
                const node = mapping ? taxonomyByCode.get(mapping.taxonomyCode) : undefined;
                return (
                  <tr key={ledger.id} className={!mapping ? 'row-warning' : ''}>
                    <td><div className="ledger-cell"><span className="ledger-code">{ledger.code}</span><strong>{ledger.name}</strong><small>{formatMoney(ledger.signedCurrentPaise, 'LAKHS')} · {ledger.group}</small></div></td>
                    <td>
                      <select value={mapping?.taxonomyCode ?? ''} disabled={busyId === ledger.id} onChange={(event) => void changeMapping(ledger.id, event.target.value)} aria-label={`Mapping for ${ledger.name}`}>
                        <option value="" disabled>Select a statement head</option>
                        {taxonomyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </td>
                    <td>{node ? <><strong>{node.statementType === 'BALANCE_SHEET' ? 'Balance Sheet' : 'Profit & Loss'}</strong><small>{node.currentNonCurrent.replace('_', ' ')} · {node.cashFlowClass}</small></> : <span className="unmapped-label">Not classified</span>}</td>
                    <td>{mapping ? <><strong>{Math.round(mapping.suggestionConfidence * 100)}%</strong><small>{mapping.suggestionReason}</small></> : <><strong>—</strong><small>No deterministic suggestion</small></>}</td>
                    <td>{mapping ? <StatusBadge tone={mapping.status === 'LOCKED' ? 'green' : mapping.status === 'APPROVED' ? 'blue' : 'amber'}>{mapping.status}</StatusBadge> : <StatusBadge tone="red">UNMAPPED</StatusBadge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{rows.length} ledger{rows.length === 1 ? '' : 's'} shown</span><span>Taxonomy {workspace.period.taxonomyVersion}</span></div>
      </section>
    </div>
  );
}

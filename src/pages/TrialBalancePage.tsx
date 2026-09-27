import { useMemo, useRef, useState } from 'react';
import { formatMoney } from '../domain/money';
import type { WorkspaceData } from '../domain/types';
import { activateTrialBalance, parseTrialBalanceFile, type TrialBalancePreview } from '../services/trialBalanceImport';
import { downloadTrialBalanceCsv } from '../services/csvExport';
import {
  downloadTrialBalanceTemplateCsv,
  downloadTrialBalanceTemplateXlsx,
  trialBalanceTemplateColumns
} from '../services/trialBalanceTemplate';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatusBadge } from '../components/ui';

export function TrialBalancePage({ workspace, notify }: { workspace: WorkspaceData; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [preview, setPreview] = useState<TrialBalancePreview>();
  const [busy, setBusy] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const fileRef = useRef<HTMLInputElement>(null);
  const ledgers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...workspace.ledgers]
      .filter((ledger) => !query || `${ledger.code} ${ledger.name} ${ledger.group} ${ledger.subGroup}`.toLowerCase().includes(query))
      .filter((ledger) => balanceFilter === 'ALL' || (balanceFilter === 'DEBIT' ? ledger.closingDebitPaise > 0 : ledger.closingCreditPaise > 0))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [workspace.ledgers, search, balanceFilter]);
  const debitTotal = workspace.ledgers.reduce((total, ledger) => total + ledger.closingDebitPaise, 0);
  const creditTotal = workspace.ledgers.reduce((total, ledger) => total + ledger.closingCreditPaise, 0);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setPreview(undefined);
    setConfirmed(false);
    try {
      setPreview(await parseTrialBalanceFile(file));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to read the file.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    if (!preview || !confirmed) return;
    setBusy(true);
    try {
      await activateTrialBalance(preview, workspace.company.id, workspace.period.id);
      notify('The balanced Trial Balance was activated. Mapping suggestions require review.', 'success');
      setShowImport(false);
      setPreview(undefined);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to activate the Trial Balance.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    try {
      downloadTrialBalanceCsv(workspace.ledgers, `WhiteHorse_${workspace.company.tradeName}_${workspace.period.endDate}_Trial_Balance`);
      notify('Trial Balance CSV generated locally.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to generate Trial Balance CSV.', 'error');
    }
  }

  async function downloadXlsxTemplate() {
    setTemplateBusy(true);
    try {
      await downloadTrialBalanceTemplateXlsx();
      notify('Prescribed XLSX Trial Balance template downloaded.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to create the XLSX template.', 'error');
    } finally {
      setTemplateBusy(false);
    }
  }

  function downloadCsvTemplate() {
    downloadTrialBalanceTemplateCsv();
    notify('Prescribed CSV Trial Balance template downloaded.', 'success');
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Imported TB → mapped TB"
        title="Trial Balance"
        description="Review source balances, provenance, comparatives, and control totals before mapping."
        actions={
          <>
            <button className="button button-secondary" onClick={() => setShowFormat(true)}><Icon name="info" size={16}/> TB import format</button>
            <button className="button button-secondary" onClick={exportCsv}><Icon name="download" size={16}/> Export CSV</button>
            <button className="button button-primary" onClick={() => setShowImport(true)}><Icon name="upload" size={16}/> Import Trial Balance</button>
          </>
        }
      />

      <section className="control-strip">
        <div className="control-stat"><span>Source</span><strong>{workspace.activeImport.fileName}</strong><small>{workspace.activeImport.sourceType} · {new Date(workspace.activeImport.importedAt).toLocaleDateString('en-IN')}</small></div>
        <div className="control-stat"><span>Ledgers</span><strong>{workspace.ledgers.length}</strong><small>Active import</small></div>
        <div className="control-stat"><span>Total debits</span><strong>{formatMoney(debitTotal, workspace.company.displayScale)}</strong><small>₹ in {workspace.company.displayScale.toLowerCase()}</small></div>
        <div className="control-stat"><span>Total credits</span><strong>{formatMoney(creditTotal, workspace.company.displayScale)}</strong><small>₹ in {workspace.company.displayScale.toLowerCase()}</small></div>
        <div className="control-stat control-success"><span>Difference</span><strong>{formatMoney(debitTotal - creditTotal, 'RUPEES')}</strong><small><Icon name="check" size={13}/> Balanced</small></div>
      </section>

      <section className="panel data-panel">
        <div className="table-toolbar">
          <div className="search-field"><Icon name="search" size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, ledger or group…" aria-label="Search ledgers"/></div>
          <div className="toolbar-actions"><StatusBadge tone="green">ACTIVE VERSION</StatusBadge><div className="segmented-control" aria-label="Balance-side filter">{(['ALL', 'DEBIT', 'CREDIT'] as const).map((value) => <button key={value} className={balanceFilter === value ? 'active' : ''} onClick={() => setBalanceFilter(value)}>{value === 'ALL' ? 'All balances' : value === 'DEBIT' ? 'Debit' : 'Credit'}</button>)}</div></div>
        </div>
        <div className="table-scroll">
          <table className="data-table tb-table">
            <thead><tr><th>Ledger</th><th>Group / sub-group</th><th className="amount-column">Closing debit</th><th className="amount-column">Closing credit</th><th className="amount-column">Comparative</th><th>Source</th></tr></thead>
            <tbody>
              {ledgers.map((ledger) => (
                <tr key={ledger.id}>
                  <td><div className="ledger-cell"><span className="ledger-code">{ledger.code}</span><strong>{ledger.name}</strong></div></td>
                  <td><span>{ledger.group}</span><small>{ledger.subGroup || '—'}</small></td>
                  <td className="amount-column">{formatMoney(ledger.closingDebitPaise, workspace.company.displayScale, { showZero: false })}</td>
                  <td className="amount-column">{formatMoney(ledger.closingCreditPaise, workspace.company.displayScale, { showZero: false })}</td>
                  <td className="amount-column">{formatMoney(ledger.signedComparativePaise, workspace.company.displayScale, { showZero: false })}</td>
                  <td><span className="source-row">Row {ledger.sourceRow}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={2}>CONTROL TOTAL</td><td className="amount-column">{formatMoney(debitTotal, workspace.company.displayScale)}</td><td className="amount-column">{formatMoney(creditTotal, workspace.company.displayScale)}</td><td colSpan={2}></td></tr></tfoot>
          </table>
        </div>
        <div className="table-footer"><span>Showing {ledgers.length} of {workspace.ledgers.length} ledgers</span><span>Amounts in ₹ {workspace.company.displayScale.toLowerCase()} · raw values retained in paise</span></div>
      </section>

      {showFormat && (
        <Modal
          title="Prescribed Trial Balance import format"
          description="Use these exact column names for repeatable onboarding. Amounts are positive INR values—not lakhs or crores."
          onClose={() => setShowFormat(false)}
          footer={<><button className="button button-secondary" onClick={downloadCsvTemplate}><Icon name="download" size={16}/> Download CSV</button><button className="button button-primary" disabled={templateBusy} onClick={() => void downloadXlsxTemplate()}><Icon name="download" size={16}/> {templateBusy ? 'Creating…' : 'Download XLSX'}</button></>}
        >
          <div className="message-box message-warning"><Icon name="warning"/><div><strong>Replace the example rows</strong><p>Delete both EXAMPLE rows and insert the complete company ledger population before import.</p></div></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Column</th><th>Requirement</th><th>Rule</th></tr></thead><tbody>{trialBalanceTemplateColumns.map((column) => <tr key={column.name}><td><strong>{column.name}</strong></td><td><StatusBadge tone={column.requirement === 'Required' ? 'blue' : 'neutral'}>{column.requirement}</StatusBadge></td><td>{column.rule}</td></tr>)}</tbody></table></div>
          <div className="editor-guidance"><Icon name="info" size={16}/><div><strong>File controls</strong><p>CSV/XLSX, header on row 1, first XLSX worksheet, maximum 25 MB / 50,000 data rows. Closing debits must equal closing credits exactly in paise. Do not include totals, merged cells, formulas or macros.</p></div></div>
        </Modal>
      )}

      {showImport && (
        <Modal
          title="Import Trial Balance"
          description="Files are parsed in this browser. They are not uploaded to a server."
          onClose={() => { setShowImport(false); setPreview(undefined); }}
          footer={
            <>
              <button className="button button-secondary" onClick={() => { setShowImport(false); setPreview(undefined); }}>Cancel</button>
              <button className="button button-primary" onClick={activate} disabled={!preview || preview.errors.length > 0 || !confirmed || busy}>
                {busy ? 'Working…' : 'Activate balanced import'}
              </button>
            </>
          }
        >
          <div className="import-zone" onClick={() => fileRef.current?.click()}>
            <span className="import-icon"><Icon name="upload" size={24}/></span>
            <strong>{busy ? 'Reading and validating…' : 'Choose an Excel or CSV Trial Balance'}</strong>
            <p>.xlsx or .csv · maximum 25 MB and 50,000 rows</p>
            <input ref={fileRef} type="file" accept=".xlsx,.csv" hidden onChange={(event) => void handleFile(event.target.files?.[0])}/>
          </div>
          <div className="template-shortcuts"><span>Need the required format?</span><button className="text-button" onClick={downloadCsvTemplate}>Download CSV template</button><button className="text-button" disabled={templateBusy} onClick={() => void downloadXlsxTemplate()}>Download XLSX template</button></div>
          {preview && (
            <div className="import-preview">
              <div className="preview-summary">
                <div><span>Rows</span><strong>{preview.rows.length}</strong></div>
                <div><span>Debit</span><strong>{formatMoney(preview.debitTotalPaise, workspace.company.displayScale)}</strong></div>
                <div><span>Credit</span><strong>{formatMoney(preview.creditTotalPaise, workspace.company.displayScale)}</strong></div>
                <div><span>Difference</span><strong className={preview.differencePaise === 0 ? 'positive' : 'negative'}>{formatMoney(preview.differencePaise, 'RUPEES')}</strong></div>
              </div>
              {preview.errors.length > 0 && <div className="message-box message-error"><Icon name="error"/><div><strong>Import blocked</strong>{preview.errors.slice(0, 5).map((error) => <p key={error}>{error}</p>)}</div></div>}
              {preview.warnings.length > 0 && <div className="message-box message-warning"><Icon name="warning"/><div><strong>Review warnings</strong>{preview.warnings.slice(0, 3).map((warning) => <p key={warning}>{warning}</p>)}</div></div>}
              {preview.rows.length > 0 && <div className="mini-preview"><table><thead><tr><th>Code</th><th>Ledger</th><th>Suggested head</th><th className="amount-column">Balance</th></tr></thead><tbody>{preview.rows.slice(0, 6).map((row) => <tr key={row.code}><td>{row.code}</td><td>{row.name}</td><td>{row.suggestedTaxonomyCode ?? <em>Unmapped</em>}</td><td className="amount-column">{formatMoney(row.signedCurrentPaise, workspace.company.displayScale)}</td></tr>)}</tbody></table></div>}
              {preview.errors.length === 0 && (
                <label className="confirmation-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span>I understand this activates a new immutable import version and supersedes the current version without deleting it.</span></label>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

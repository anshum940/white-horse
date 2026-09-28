import { useMemo, useRef, useState } from 'react';
import { formatMoney } from '../domain/money';
import type { WorkspaceData } from '../domain/types';
import {
  activateTrialBalance,
  parseTrialBalanceFile,
  trialBalanceColumnRoles,
  type SignedBalanceConvention,
  type TrialBalanceColumnMap,
  type TrialBalanceColumnRole,
  type TrialBalancePreview
} from '../services/trialBalanceImport';
import { downloadTrialBalanceCsv } from '../services/csvExport';
import {
  downloadTrialBalanceTemplateCsv,
  downloadTrialBalanceTemplateXlsx,
  trialBalanceTemplateColumns,
  trialBalanceTemplateVersion
} from '../services/trialBalanceTemplate';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatusBadge } from '../components/ui';

export function TrialBalancePage({ workspace, notify }: { workspace: WorkspaceData; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [preview, setPreview] = useState<TrialBalancePreview>();
  const [selectedFile, setSelectedFile] = useState<File>();
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [worksheetName, setWorksheetName] = useState('');
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [headerDepth, setHeaderDepth] = useState<1 | 2>(1);
  const [columnMap, setColumnMap] = useState<TrialBalanceColumnMap>({});
  const [signedBalanceConvention, setSignedBalanceConvention] = useState<SignedBalanceConvention | ''>('');
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

  function applyPreview(next: TrialBalancePreview) {
    setPreview(next);
    setWorksheetName(next.selectedWorksheet);
    setHeaderRowNumber(next.headerRowNumber);
    setHeaderDepth(next.headerDepth);
    setColumnMap({ ...next.columnMap });
    setSignedBalanceConvention(next.signedBalanceConvention ?? '');
    setShowColumnMapping(next.mappingRequired);
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setPreview(undefined);
    setSelectedFile(file);
    setShowColumnMapping(false);
    setConfirmed(false);
    try {
      applyPreview(await parseTrialBalanceFile(file));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to read the file.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function detectSelectedSource() {
    if (!selectedFile) return;
    setBusy(true);
    setConfirmed(false);
    try {
      applyPreview(await parseTrialBalanceFile(selectedFile, {
        worksheetName: worksheetName || undefined,
        headerRowNumber,
        headerDepth
      }));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to inspect the selected worksheet and header.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function applyColumnMapping() {
    if (!selectedFile) return;
    setBusy(true);
    setConfirmed(false);
    try {
      applyPreview(await parseTrialBalanceFile(selectedFile, {
        worksheetName,
        headerRowNumber,
        headerDepth,
        columnMap,
        signedBalanceConvention: signedBalanceConvention || undefined
      }));
      setShowColumnMapping(true);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to apply the column mapping.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function mapColumn(role: TrialBalanceColumnRole, value: string) {
    setColumnMap((current) => {
      const next = { ...current };
      if (value === '') delete next[role];
      else next[role] = Number(value);
      return next;
    });
  }

  function closeImport() {
    setShowImport(false);
    setPreview(undefined);
    setSelectedFile(undefined);
    setShowColumnMapping(false);
    setConfirmed(false);
  }

  async function activate() {
    if (!preview || !confirmed) return;
    setBusy(true);
    try {
      await activateTrialBalance(preview, workspace.company.id, workspace.period.id);
      notify('The balanced Trial Balance was activated. Mapping suggestions require review.', 'success');
      closeImport();
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
      notify('Standard TB XLSX template downloaded.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to create the XLSX template.', 'error');
    } finally {
      setTemplateBusy(false);
    }
  }

  function downloadCsvTemplate() {
    downloadTrialBalanceTemplateCsv();
    notify('Standard TB CSV template downloaded.', 'success');
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Imported TB → mapped TB"
        title="Trial Balance"
        description="Review source balances, provenance, comparatives, and control totals before mapping."
        actions={
          <>
            <button className="button button-secondary" onClick={() => setShowFormat(true)}><Icon name="info" size={16}/> Standard TB template</button>
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
          title="White Horse Standard TB format"
          description={`Vendor-neutral import format ${trialBalanceTemplateVersion}. Use it for every company and accounting package.`}
          onClose={() => setShowFormat(false)}
          footer={<><button className="button button-secondary" onClick={downloadCsvTemplate}><Icon name="download" size={16}/> Download CSV</button><button className="button button-primary" disabled={templateBusy} onClick={() => void downloadXlsxTemplate()}><Icon name="download" size={16}/> {templateBusy ? 'Creating…' : 'Download XLSX'}</button></>}
        >
          <div className="message-box message-info"><Icon name="info"/><div><strong>The template is optional</strong><p>White Horse now detects common accounting-software exports directly. Use this standard template when you want the fastest repeatable import or when a source file has merged, decorative or ambiguous columns.</p></div></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Column</th><th>Requirement</th><th>Rule</th></tr></thead><tbody>{trialBalanceTemplateColumns.map((column) => <tr key={column.name}><td><strong>{column.name}</strong></td><td><StatusBadge tone={column.requirement === 'Required' ? 'blue' : 'neutral'}>{column.requirement}</StatusBadge></td><td>{column.rule}</td></tr>)}</tbody></table></div>
          <div className="editor-guidance"><Icon name="info" size={16}/><div><strong>File controls</strong><p>XLSX, CSV, TSV or delimited TXT; maximum 25 MB, 200,000 workbook rows and 50,000 rows in the selected worksheet. Closing debits must equal closing credits exactly in paise. XLS macros and scanned or password-protected files are not supported.</p></div></div>
        </Modal>
      )}

      {showImport && (
        <Modal
          title="Import Trial Balance"
          description="Upload a tabular accounting export. White Horse detects the worksheet, header row and common balance layouts locally in this browser."
          onClose={closeImport}
          footer={
            <>
              <button className="button button-secondary" onClick={closeImport}>Cancel</button>
              <button className="button button-primary" onClick={activate} disabled={!preview || preview.mappingRequired || preview.errors.length > 0 || !confirmed || busy}>
                {busy ? 'Working…' : 'Activate balanced import'}
              </button>
            </>
          }
        >
          <div className="standard-format-card">
            <div>
              <StatusBadge tone="blue">{trialBalanceTemplateVersion}</StatusBadge>
              <strong>Direct export or standard template</strong>
              <p>Try the XLSX/CSV export from Tally, SAP, Zoho, Busy, QuickBooks or another system. If its meaning is unclear, White Horse opens a column mapper instead of rejecting the file.</p>
            </div>
            <div className="standard-format-actions">
              <button className="button button-primary" disabled={templateBusy} onClick={() => void downloadXlsxTemplate()}><Icon name="download" size={16}/> {templateBusy ? 'Downloading…' : 'XLSX template'}</button>
              <button className="button button-secondary" onClick={downloadCsvTemplate}><Icon name="download" size={16}/> CSV template</button>
            </div>
          </div>
          <ol className="standard-import-steps">
            <li>Export a ledger-level Trial Balance in INR as XLSX, CSV, TSV or delimited TXT.</li>
            <li>Upload it directly. White Horse scans worksheets and the first 50 rows for the table header.</li>
            <li>Review detected columns and totals. Map ambiguous columns once before activation.</li>
          </ol>
          <div className="import-zone" onClick={() => fileRef.current?.click()}>
            <span className="import-icon"><Icon name="upload" size={24}/></span>
            <strong>{busy ? 'Reading and validating…' : 'Choose any tabular Trial Balance export'}</strong>
            <p>.xlsx, .csv, .tsv or delimited .txt · automatic worksheet/header detection · maximum 25 MB</p>
            <input ref={fileRef} type="file" accept=".xlsx,.csv,.tsv,.txt" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void handleFile(file); }}/>
          </div>
          {preview && (
            <div className="import-preview">
              <div className="format-result">
                <StatusBadge tone={preview.formatStatus === 'STANDARD' || preview.formatStatus === 'COMPATIBLE' ? 'green' : preview.formatStatus === 'NEEDS_MAPPING' ? 'amber' : 'red'}>
                  {preview.formatStatus === 'STANDARD' ? 'STANDARD FORMAT' : preview.formatStatus === 'COMPATIBLE' ? 'ADAPTIVE IMPORT READY' : preview.formatStatus === 'NEEDS_MAPPING' ? 'MAPPING REQUIRED' : 'IMPORT BLOCKED'}
                </StatusBadge>
                <span>{preview.formatStatus === 'STANDARD' ? `${trialBalanceTemplateVersion} headers verified.` : preview.detectionSummary}</span>
              </div>
              <section className="source-detection">
                <div className="source-detection-summary">
                  <div><span>Worksheet</span><strong>{preview.selectedWorksheet}</strong></div>
                  <div><span>Header</span><strong>Row {preview.headerRowNumber}{preview.headerDepth === 2 ? ' · two-tier' : ''}</strong></div>
                  <div><span>Detection</span><strong>{preview.detectionConfidence}</strong></div>
                  <button className="button button-secondary" onClick={() => setShowColumnMapping((current) => !current)}><Icon name="settings" size={15}/> {showColumnMapping ? 'Hide mapping' : 'Review mapping'}</button>
                </div>
                {showColumnMapping && (
                  <div className="column-mapping-panel">
                    <div className="mapping-source-grid">
                      <label className="field"><span>Worksheet</span><select value={worksheetName} onChange={(event) => setWorksheetName(event.target.value)}>{preview.worksheetNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
                      <label className="field"><span>Header row</span><input type="number" min={1} step={1} value={headerRowNumber} onChange={(event) => setHeaderRowNumber(Math.max(1, Number(event.target.value) || 1))}/></label>
                      <label className="field"><span>Header rows</span><select value={headerDepth} onChange={(event) => setHeaderDepth(Number(event.target.value) as 1 | 2)}><option value={1}>One row</option><option value={2}>Two-tier header</option></select></label>
                      <button className="button button-secondary mapping-detect-button" disabled={busy} onClick={() => void detectSelectedSource()}>{busy ? 'Detecting…' : 'Read these headers'}</button>
                    </div>
                    <div className="mapping-guidance"><Icon name="info" size={15}/><p>Map a ledger name plus either (a) closing debit and closing credit, (b) one signed closing balance, or (c) period debit and credit movements. A ledger code is optional.</p></div>
                    <div className="column-mapping-grid">
                      {trialBalanceColumnRoles.map((role) => (
                        <label className="field" key={role.key}>
                          <span>{role.label}<small>{role.requirement}</small></span>
                          <select value={columnMap[role.key] ?? ''} onChange={(event) => mapColumn(role.key, event.target.value)}>
                            <option value="">Not mapped</option>
                            {preview.availableColumns.map((column) => <option key={column.index} value={column.index}>{column.label}{column.samples.length ? ` — ${column.samples.join(' / ')}` : ''}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                    <label className="field signed-convention-field"><span>Unsigned balance convention<small>Needed only when a signed-balance column has no Dr/Cr values</small></span><select value={signedBalanceConvention} onChange={(event) => setSignedBalanceConvention(event.target.value as SignedBalanceConvention | '')}><option value="">Use Dr/Cr values in the file</option><option value="DEBIT_POSITIVE">Positive = debit; negative = credit</option><option value="CREDIT_POSITIVE">Positive = credit; negative = debit</option></select></label>
                    <div className="mapping-actions"><button className="button button-primary" disabled={busy} onClick={() => void applyColumnMapping()}><Icon name="check" size={15}/> {busy ? 'Applying…' : 'Apply mapping and validate'}</button></div>
                  </div>
                )}
              </section>
              <div className="preview-summary">
                <div><span>Rows</span><strong>{preview.rows.length}</strong></div>
                <div><span>Debit</span><strong>{formatMoney(preview.debitTotalPaise, workspace.company.displayScale)}</strong></div>
                <div><span>Credit</span><strong>{formatMoney(preview.creditTotalPaise, workspace.company.displayScale)}</strong></div>
                <div><span>Difference</span><strong className={preview.differencePaise === 0 ? 'positive' : 'negative'}>{formatMoney(preview.differencePaise, 'RUPEES')}</strong></div>
              </div>
              {preview.errors.length > 0 && <div className="message-box message-error"><Icon name="error"/><div><strong>Import blocked</strong>{preview.errors.slice(0, 5).map((error) => <p key={error}>{error}</p>)}</div></div>}
              {preview.warnings.length > 0 && <div className="message-box message-warning"><Icon name="warning"/><div><strong>{preview.mappingRequired ? 'Complete the mapping' : 'Review warnings'}</strong>{preview.warnings.slice(0, 6).map((warning) => <p key={warning}>{warning}</p>)}</div></div>}
              {preview.rows.length > 0 && <div className="mini-preview"><table><thead><tr><th>Code</th><th>Ledger</th><th>Suggested head</th><th className="amount-column">Balance</th></tr></thead><tbody>{preview.rows.slice(0, 6).map((row) => <tr key={row.code}><td>{row.code}</td><td>{row.name}</td><td>{row.suggestedTaxonomyCode ?? <em>Unmapped</em>}</td><td className="amount-column">{formatMoney(row.signedCurrentPaise, workspace.company.displayScale)}</td></tr>)}</tbody></table></div>}
              {!preview.mappingRequired && preview.errors.length === 0 && (
                <label className="confirmation-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span>I understand this activates a new immutable import version and supersedes the current version without deleting it.</span></label>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

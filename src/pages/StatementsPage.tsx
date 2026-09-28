import { useMemo, useState } from 'react';
import { updateStatementSignatureSettings } from '../db';
import { formatMoney } from '../domain/money';
import {
  defaultStatementSignatureSettings,
  normaliseStatementSignatureSettings,
  validateStatementSignatureSettings
} from '../domain/signatureSettings';
import type { FinancialStatements, KpiSet, ReportLine, StatementSignatureSettings, ValidationResult, WorkspaceData } from '../domain/types';
import { exportFinancialWorkbook } from '../services/excelExport';
import { FinancialPdfPack } from '../components/FinancialPdfPack';
import { Icon } from '../components/Icon';
import { StatementSignatures } from '../components/StatementSignatures';
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
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureBusy, setSignatureBusy] = useState(false);
  const [signatureSubmitted, setSignatureSubmitted] = useState(false);
  const [signatureDraft, setSignatureDraft] = useState<StatementSignatureSettings>(() => workspace.period.signatureSettings ?? defaultStatementSignatureSettings(workspace.period.endDate, workspace.company.registeredOffice));
  const signatureErrors = useMemo(
    () => validateStatementSignatureSettings(signatureDraft, { periodEndDate: workspace.period.endDate }),
    [signatureDraft, workspace.period.endDate]
  );
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

  function openSignatureSettings() {
    setSignatureDraft(workspace.period.signatureSettings ?? defaultStatementSignatureSettings(workspace.period.endDate, workspace.company.registeredOffice));
    setSignatureSubmitted(false);
    setSignatureOpen(true);
  }

  function updateSignatureField<K extends keyof StatementSignatureSettings>(field: K, value: StatementSignatureSettings[K]) {
    setSignatureDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveSignatureSettings() {
    setSignatureSubmitted(true);
    const firstError = Object.values(signatureErrors)[0];
    if (firstError) {
      notify(firstError, 'error');
      return;
    }
    setSignatureBusy(true);
    try {
      await updateStatementSignatureSettings(
        workspace.company.id,
        workspace.period.id,
        normaliseStatementSignatureSettings(signatureDraft)
      );
      setSignatureOpen(false);
      notify('PDF signing-block settings saved for this reporting period.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save signing-block settings.', 'error');
    } finally {
      setSignatureBusy(false);
    }
  }

  function exportPdf() {
    if (!workspace.ledgers.length) {
      notify('Import and activate a Trial Balance before exporting the PDF pack.', 'error');
      return;
    }
    const mappedLedgerIds = new Set(workspace.mappings.filter((mapping) => mapping.taxonomyCode).map((mapping) => mapping.ledgerId));
    const unmapped = workspace.ledgers.filter((ledger) => !mappedLedgerIds.has(ledger.id)).length;
    if (unmapped > 0) {
      notify(`${unmapped} active ledger${unmapped === 1 ? ' is' : 's are'} unmapped. Complete mapping before exporting the PDF pack.`, 'error');
      return;
    }
    notify('PDF-ready A4 pack opened. Choose “Save as PDF” in the print dialog.', 'success');
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <div className="page statement-page">
      <PageHeader
        eyebrow="Adjusted TB → financial statements"
        title="Financial statements"
        description="Schedule III Division I-oriented presentation with comparatives, note references and full ledger drill-down."
        actions={<><button className="button button-secondary" onClick={openSignatureSettings}><Icon name="settings" size={16}/> PDF & signatures</button><button className="button button-secondary" onClick={exportPdf}><Icon name="print" size={16}/> Export PDF</button><button className="button button-primary" disabled={exporting} onClick={() => void exportWorkbook()}><Icon name="download" size={16}/> {exporting ? 'Generating…' : 'Generate complete financials'}</button></>}
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
        <StatementSignatures settings={workspace.period.signatureSettings}/>
        <footer className="report-footer-note">
          <p>See accompanying notes forming part of these financial statements.</p>
          <p>Prepared using taxonomy {workspace.period.taxonomyVersion}. {workspace.company.id === 'demo-company' ? 'Synthetic demonstration data — not for statutory filing.' : 'Subject to preparer/reviewer completion of all applicable disclosures.'}</p>
        </footer>
      </section>

      <FinancialPdfPack workspace={workspace} statements={statements} kpis={kpis}/>

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

      {signatureOpen && (
        <Modal
          title="PDF and signing blocks"
          description="Configure the text placeholders printed at the lower left and lower right of each face statement. Settings are saved for this company and reporting period."
          onClose={() => setSignatureOpen(false)}
          footer={<><button className="button button-secondary" onClick={() => setSignatureOpen(false)}>Cancel</button><button className="button button-primary" disabled={signatureBusy || workspace.period.status === 'FINALISED'} onClick={() => void saveSignatureSettings()}>{signatureBusy ? 'Saving…' : 'Save settings'}</button></>}
        >
          <div className="message-box message-warning"><Icon name="warning"/><div><strong>Signing control</strong><p>These are unsigned text blocks and signature lines. White Horse does not apply a handwritten, electronic or digital signature. Confirm the signatories required by section 134 and attach the applicable auditor’s report before statutory use.</p></div></div>
          {workspace.period.status === 'FINALISED' && <div className="message-box message-error"><Icon name="lock"/><div><strong>Period finalised</strong><p>Reopen the reporting period before changing signing blocks.</p></div></div>}
          <section className="signature-settings-section">
            <label className="signature-toggle"><input type="checkbox" checked={signatureDraft.showDirector} onChange={(event) => updateSignatureField('showDirector', event.target.checked)}/><span><strong>Show Director signature block</strong><small>Printed at the lower left of each face statement.</small></span></label>
            {signatureDraft.showDirector && <div className="form-grid signature-fields">
              <label className={`field ${signatureSubmitted && signatureErrors.directorName ? 'field-invalid' : ''}`}><span>Director full name *</span><input maxLength={150} value={signatureDraft.directorName} onChange={(event) => updateSignatureField('directorName', event.target.value)}/>{signatureSubmitted && signatureErrors.directorName && <small className="field-error">{signatureErrors.directorName}</small>}</label>
              <label className={`field ${signatureSubmitted && signatureErrors.directorDesignation ? 'field-invalid' : ''}`}><span>Designation *</span><input maxLength={80} value={signatureDraft.directorDesignation} onChange={(event) => updateSignatureField('directorDesignation', event.target.value)}/>{signatureSubmitted && signatureErrors.directorDesignation && <small className="field-error">{signatureErrors.directorDesignation}</small>}</label>
              <label className={`field ${signatureSubmitted && signatureErrors.directorDin ? 'field-invalid' : ''}`}><span>DIN *</span><input inputMode="numeric" maxLength={8} placeholder="8 digits" value={signatureDraft.directorDin} onChange={(event) => updateSignatureField('directorDin', event.target.value.replace(/\D/g, '').slice(0, 8))}/>{signatureSubmitted && signatureErrors.directorDin && <small className="field-error">{signatureErrors.directorDin}</small>}</label>
            </div>}
          </section>
          <section className="signature-settings-section">
            <label className="signature-toggle"><input type="checkbox" checked={signatureDraft.showCharteredAccountant} onChange={(event) => updateSignatureField('showCharteredAccountant', event.target.checked)}/><span><strong>Show Chartered Accountant signature block</strong><small>Printed at the lower right of each face statement.</small></span></label>
            {signatureDraft.showCharteredAccountant && <div className="form-grid signature-fields">
              <label className="field"><span>Capacity *</span><select value={signatureDraft.caCapacity} onChange={(event) => updateSignatureField('caCapacity', event.target.value as StatementSignatureSettings['caCapacity'])}><option value="PREPARER">Prepared by</option><option value="COMPILER">Compiled by</option><option value="STATUTORY_AUDITOR">Statutory auditor — report attached</option></select></label>
              <label className={`field ${signatureSubmitted && signatureErrors.caFirmName ? 'field-invalid' : ''}`}><span>Firm / practitioner name *</span><input maxLength={180} value={signatureDraft.caFirmName} onChange={(event) => updateSignatureField('caFirmName', event.target.value)}/>{signatureSubmitted && signatureErrors.caFirmName && <small className="field-error">{signatureErrors.caFirmName}</small>}</label>
              <label className="field"><span>Firm registration number</span><input maxLength={30} value={signatureDraft.caFirmRegistrationNumber} onChange={(event) => updateSignatureField('caFirmRegistrationNumber', event.target.value.toUpperCase())}/></label>
              <label className={`field ${signatureSubmitted && signatureErrors.caName ? 'field-invalid' : ''}`}><span>Signing CA full name *</span><input maxLength={150} value={signatureDraft.caName} onChange={(event) => updateSignatureField('caName', event.target.value)}/>{signatureSubmitted && signatureErrors.caName && <small className="field-error">{signatureErrors.caName}</small>}</label>
              <label className={`field ${signatureSubmitted && signatureErrors.caDesignation ? 'field-invalid' : ''}`}><span>Designation *</span><input maxLength={80} value={signatureDraft.caDesignation} onChange={(event) => updateSignatureField('caDesignation', event.target.value)}/>{signatureSubmitted && signatureErrors.caDesignation && <small className="field-error">{signatureErrors.caDesignation}</small>}</label>
              <label className={`field ${signatureSubmitted && signatureErrors.caMembershipNumber ? 'field-invalid' : ''}`}><span>ICAI membership number *</span><input inputMode="numeric" maxLength={6} placeholder="6 digits" value={signatureDraft.caMembershipNumber} onChange={(event) => updateSignatureField('caMembershipNumber', event.target.value.replace(/\D/g, '').slice(0, 6))}/>{signatureSubmitted && signatureErrors.caMembershipNumber && <small className="field-error">{signatureErrors.caMembershipNumber}</small>}</label>
              <label className={`field ${signatureSubmitted && signatureErrors.caUdin ? 'field-invalid' : ''}`}><span>UDIN <small>Optional; belongs on the applicable CA report</small></span><input maxLength={18} placeholder="18 characters" value={signatureDraft.caUdin} onChange={(event) => updateSignatureField('caUdin', event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 18))}/>{signatureSubmitted && signatureErrors.caUdin && <small className="field-error">{signatureErrors.caUdin}</small>}</label>
            </div>}
          </section>
          {(signatureDraft.showDirector || signatureDraft.showCharteredAccountant) && <section className="signature-common-fields form-grid">
            <label className={`field ${signatureSubmitted && signatureErrors.place ? 'field-invalid' : ''}`}><span>Place *</span><input maxLength={120} value={signatureDraft.place} onChange={(event) => updateSignatureField('place', event.target.value)}/>{signatureSubmitted && signatureErrors.place && <small className="field-error">{signatureErrors.place}</small>}</label>
            <label className={`field ${signatureSubmitted && signatureErrors.signingDate ? 'field-invalid' : ''}`}><span>Signing date *</span><input type="date" min={workspace.period.endDate} value={signatureDraft.signingDate} onChange={(event) => updateSignatureField('signingDate', event.target.value)}/>{signatureSubmitted && signatureErrors.signingDate && <small className="field-error">{signatureErrors.signingDate}</small>}</label>
          </section>}
        </Modal>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { finalisePeriod } from '../db';
import type { FinancialStatements, ValidationResult, WorkspaceData } from '../domain/types';
import { createBackupBlob, downloadBlob, readBackupFile, restoreBackupPayload, type BackupEnvelope } from '../services/backup';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatusBadge } from '../components/ui';

export function FinalisationPage({ workspace, statements, validations, notify }: { workspace: WorkspaceData; statements: FinancialStatements; validations: ValidationResult[]; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [backupModal, setBackupModal] = useState(false);
  const [restoreModal, setRestoreModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupDone, setBackupDone] = useState(false);
  const [restoreData, setRestoreData] = useState<{ payload: Awaited<ReturnType<typeof readBackupFile>>['payload']; envelope: BackupEnvelope }>();
  const [restorePhrase, setRestorePhrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const openIssues = validations.filter((item) => item.status === 'OPEN' && item.severity !== 'INFO');
  const allMappingsLocked = workspace.ledgers.every((ledger) => workspace.mappings.find((mapping) => mapping.ledgerId === ledger.id)?.status === 'LOCKED');
  const noPendingAdjustments = !workspace.adjustments.some((item) => item.status === 'SUBMITTED');
  const notesReady = !workspace.notes.some((item) => item.status === 'PENDING');
  const coreReconciled = statements.totals.balanceSheetDifference === 0 && statements.totals.cashFlowDifference === 0 && workspace.activeImport.differencePaise === 0;
  const checks = [
    ['Trial Balance and statement reconciliations', coreReconciled, 'TB, Balance Sheet and cash-flow differences must be zero in paise.'],
    ['Mapping version locked', allMappingsLocked, 'Every active ledger mapping requires reviewer lock.'],
    ['Adjustment review complete', noPendingAdjustments, 'Submitted journals must be posted or rejected.'],
    ['Disclosure notes complete', notesReady, 'Pending notes must be completed or marked not applicable.'],
    ['Validation results cleared', openIssues.length === 0, `${openIssues.length} open error/warning result${openIssues.length === 1 ? '' : 's'}.`],
    ['Verified backup downloaded', backupDone, 'Download and retain an encrypted backup before finalisation.']
  ] as const;
  const canFinalise = checks.every(([, passed]) => passed);

  async function backup(encrypted: boolean) {
    setBusy(true);
    try {
      const result = await createBackupBlob(encrypted ? passphrase : undefined);
      downloadBlob(result.blob, result.fileName);
      setBackupDone(true);
      setBackupModal(false);
      setPassphrase('');
      notify(`${result.encrypted ? 'Encrypted' : 'Plain JSON'} backup generated locally.`, 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to create backup.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function readRestore(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await readBackupFile(file, restorePassphrase || undefined);
      setRestoreData(data);
      notify('Backup integrity verified. Review its contents before restoring.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to inspect backup.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!restoreData || restorePhrase !== 'RESTORE') return;
    setBusy(true);
    try {
      await restoreBackupPayload(restoreData.payload);
      setRestoreModal(false);
      setRestoreData(undefined);
      setRestorePhrase('');
      notify('Backup restored after integrity validation.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to restore backup.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function finalise() {
    setBusy(true);
    try {
      await finalisePeriod(workspace.period.id, openIssues.length);
      notify('Reporting period finalised and locked.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to finalise period.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Review → finalisation" title="Finalisation & recovery" description="Complete the review gates, create a verified backup and lock the reporting-period revision." actions={<><button className="button button-secondary" onClick={() => setRestoreModal(true)}><Icon name="upload" size={16}/> Restore</button><button className="button button-primary" onClick={() => setBackupModal(true)}><Icon name="download" size={16}/> Create backup</button></>}/>
      <section className={`final-status panel ${workspace.period.status === 'FINALISED' ? 'finalised' : ''}`}>
        <span className="final-status-icon"><Icon name={workspace.period.status === 'FINALISED' ? 'lock' : 'unlock'} size={28}/></span>
        <div><span>Period status</span><h2>{workspace.period.status === 'FINALISED' ? 'Finalised and read-only' : 'Draft — finalisation gates open'}</h2><p>Revision {workspace.period.revision} · {workspace.period.label} · taxonomy {workspace.period.taxonomyVersion}</p></div>
        <StatusBadge tone={workspace.period.status === 'FINALISED' ? 'green' : 'amber'}>{workspace.period.status.replaceAll('_', ' ')}</StatusBadge>
      </section>
      <section className="finalisation-grid">
        <article className="panel checklist-panel"><div className="panel-heading"><div><span className="panel-kicker">Mandatory controls</span><h2>Pre-finalisation checklist</h2></div><strong>{checks.filter(([, passed]) => passed).length}/{checks.length}</strong></div><div className="final-checks">{checks.map(([label, passed, detail]) => <div key={label} className={passed ? 'passed' : 'pending'}><span><Icon name={passed ? 'check' : 'warning'} size={16}/></span><div><strong>{label}</strong><small>{detail}</small></div><StatusBadge tone={passed ? 'green' : 'amber'}>{passed ? 'PASSED' : 'PENDING'}</StatusBadge></div>)}</div><button className="button button-primary button-wide" disabled={!canFinalise || busy || workspace.period.status === 'FINALISED'} onClick={() => void finalise()}><Icon name="lock" size={16}/>{workspace.period.status === 'FINALISED' ? 'Period already finalised' : 'Finalise reporting period'}</button></article>
        <aside className="final-side">
          <article className="panel backup-card"><span className="card-icon"><Icon name="database"/></span><h3>Local backup</h3><p>Export every company, period, ledger, mapping, adjustment, note and audit event.</p><div className="backup-state"><span className={backupDone ? 'positive' : 'neutral'}>{backupDone ? 'Created this session' : 'Not created this session'}</span></div><button className="button button-secondary button-wide" onClick={() => setBackupModal(true)}>Create encrypted backup</button></article>
          <article className="panel security-card"><span className="card-icon"><Icon name="shield"/></span><h3>Local-only assurance</h3><p>Backups are generated and encrypted in this browser. They are never uploaded by White Horse.</p><ul><li>AES-GCM authenticated encryption</li><li>PBKDF2 passphrase derivation</li><li>Integrity validation before restore</li></ul></article>
        </aside>
      </section>
      <section className="panel audit-panel"><div className="panel-heading"><div><span className="panel-kicker">Traceability</span><h2>Recent audit events</h2></div><StatusBadge tone="neutral">HASH CHAIN</StatusBadge></div><div className="audit-list">{[...workspace.auditEvents].reverse().slice(0, 6).map((event) => <div key={event.id}><span className="audit-dot"/><div><strong>{event.action.replaceAll('_', ' ')}</strong><small>{event.reason}</small></div><time>{new Date(event.timestamp).toLocaleString('en-IN')}</time><code>#{event.sequence}</code></div>)}</div></section>

      {backupModal && <Modal title="Create local backup" description="Use an encrypted backup for any real financial information." onClose={() => setBackupModal(false)} footer={<><button className="button button-secondary" disabled={busy} onClick={() => void backup(false)}>Download plain JSON</button><button className="button button-primary" disabled={busy || passphrase.length < 12} onClick={() => void backup(true)}>{busy ? 'Encrypting…' : 'Encrypt & download'}</button></>}><div className="message-box message-warning"><Icon name="warning"/><div><strong>Keep the passphrase separately</strong><p>White Horse cannot recover a forgotten backup passphrase.</p></div></div><label className="field"><span>Backup passphrase (minimum 12 characters)</span><input type="password" autoComplete="new-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="Enter a strong unique passphrase"/><small>{passphrase.length}/12 minimum</small></label></Modal>}
      {restoreModal && <Modal title="Restore verified backup" description="Restore replaces the current browser database. Create a backup first." onClose={() => { setRestoreModal(false); setRestoreData(undefined); }} footer={<><button className="button button-secondary" onClick={() => setRestoreModal(false)}>Cancel</button><button className="button button-danger" disabled={!restoreData || restorePhrase !== 'RESTORE' || busy} onClick={() => void restore()}>{busy ? 'Restoring…' : 'Replace local database'}</button></>}><div className="restore-picker"><label className="field"><span>Passphrase (only for encrypted backups)</span><input type="password" value={restorePassphrase} onChange={(event) => setRestorePassphrase(event.target.value)}/></label><button className="button button-secondary" onClick={() => restoreFileRef.current?.click()}><Icon name="upload" size={16}/> Choose backup file</button><input ref={restoreFileRef} hidden type="file" accept=".json,.whbackup" onChange={(event) => void readRestore(event.target.files?.[0])}/></div>{restoreData && <div className="restore-summary"><StatusBadge tone="green">INTEGRITY VERIFIED</StatusBadge><p>Created {new Date(restoreData.envelope.createdAt).toLocaleString('en-IN')} · app {restoreData.envelope.applicationVersion}</p><div><span>Companies <strong>{restoreData.payload.companies.length}</strong></span><span>Periods <strong>{restoreData.payload.periods.length}</strong></span><span>Ledgers <strong>{restoreData.payload.ledgers.length}</strong></span><span>Audit events <strong>{restoreData.payload.auditEvents.length}</strong></span></div><label className="field"><span>Type RESTORE to confirm replacement</span><input value={restorePhrase} onChange={(event) => setRestorePhrase(event.target.value)}/></label></div>}</Modal>}
    </div>
  );
}

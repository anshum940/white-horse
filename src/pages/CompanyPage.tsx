import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addLocalUser,
  createCompanyWorkspace,
  updateCompanyWorkspace,
  updateLocalUser,
  type CompanyWorkspaceInput
} from '../db';
import { formatMoney, rupeesToPaise } from '../domain/money';
import {
  CIN_LENGTH,
  defaultIndianFinancialPeriods,
  normaliseCinInput,
  validateCompanyWorkspaceInput
} from '../domain/companyValidation';
import type { LocalUser, WorkspaceData } from '../domain/types';
import {
  getStoragePersistenceStatus,
  requestStoragePersistence,
  type StoragePersistenceStatus
} from '../services/storagePersistence';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatusBadge } from '../components/ui';

interface SetupFormState extends Omit<CompanyWorkspaceInput, 'materialityPaise'> {
  materialityRupees: string;
}

const blankSetup = (): SetupFormState => ({
  legalName: '', tradeName: '', cin: '', registeredOffice: '', industry: '', displayScale: 'LAKHS',
  ...defaultIndianFinancialPeriods(),
  materialityRupees: '250000'
});

type SetupValidationErrors = Partial<Record<keyof SetupFormState, string>>;

function validateSetup(setup: SetupFormState): { input: CompanyWorkspaceInput; errors: SetupValidationErrors } {
  let materialityPaise = 0;
  let conversionError: string | undefined;
  try {
    materialityPaise = rupeesToPaise(setup.materialityRupees);
  } catch {
    conversionError = 'Enter a valid INR amount with no more than two decimal places.';
  }
  const input: CompanyWorkspaceInput = { ...setup, materialityPaise };
  const { materialityPaise: materialityError, ...errors } = validateCompanyWorkspaceInput(input);
  return {
    input,
    errors: {
      ...errors,
      ...(conversionError || materialityError ? { materialityRupees: conversionError ?? materialityError } : {})
    }
  };
}

function setupFromWorkspace(workspace: WorkspaceData): SetupFormState {
  return {
    legalName: workspace.company.legalName,
    tradeName: workspace.company.tradeName,
    cin: workspace.company.cin,
    registeredOffice: workspace.company.registeredOffice,
    industry: workspace.company.industry,
    displayScale: workspace.company.displayScale,
    periodLabel: workspace.period.label,
    startDate: workspace.period.startDate,
    endDate: workspace.period.endDate,
    comparativeLabel: workspace.period.comparativeLabel,
    comparativeStartDate: workspace.period.comparativeStartDate,
    comparativeEndDate: workspace.period.comparativeEndDate,
    materialityRupees: (workspace.period.materialityPaise / 100).toFixed(2)
  };
}

export function CompanyPage({ workspace, notify, onCompanyCreated }: {
  workspace: WorkspaceData;
  notify: (message: string, tone?: 'success' | 'error') => void;
  onCompanyCreated: (companyId: string) => void;
}) {
  const [setupMode, setSetupMode] = useState<'create' | 'edit'>();
  const [setup, setSetup] = useState<SetupFormState>(() => setupFromWorkspace(workspace));
  const [touchedSetupFields, setTouchedSetupFields] = useState<Set<keyof SetupFormState>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [storageBusy, setStorageBusy] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StoragePersistenceStatus>('CHECKING');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<{ displayName: string; username: string; role: LocalUser['role'] }>({ displayName: '', username: '', role: 'PREPARER' });
  const [editingUser, setEditingUser] = useState<LocalUser>();
  const [editUserForm, setEditUserForm] = useState<{ displayName: string; role: LocalUser['role']; active: boolean }>({ displayName: '', role: 'PREPARER', active: true });

  const setupValidation = useMemo(() => validateSetup(setup), [setup]);
  const setupErrorCount = Object.keys(setupValidation.errors).length;

  useEffect(() => {
    let cancelled = false;
    void getStoragePersistenceStatus().then((status) => {
      if (!cancelled) setStorageStatus(status);
    });
    return () => { cancelled = true; };
  }, []);

  function openEdit() { setSetup(setupFromWorkspace(workspace)); setTouchedSetupFields(new Set()); setSetupMode('edit'); }
  function openCreate() { setSetup(blankSetup()); setTouchedSetupFields(new Set()); setSetupMode('create'); }

  async function saveSetup() {
    if (!setupMode || setupErrorCount > 0) return;
    setBusy(true);
    try {
      if (setupMode === 'create') {
        const companyId = await createCompanyWorkspace(setupValidation.input);
        setSetupMode(undefined);
        onCompanyCreated(companyId);
        notify('New company workspace created. Import its Trial Balance to begin.', 'success');
      } else {
        await updateCompanyWorkspace(workspace.company.id, workspace.period.id, setupValidation.input);
        setSetupMode(undefined);
        notify('Company and reporting-period setup updated with an audit event.', 'success');
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save company setup.', 'error');
    } finally { setBusy(false); }
  }

  function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouchedSetupFields(new Set(Object.keys(setup) as Array<keyof SetupFormState>));
    void saveSetup();
  }

  async function protectBrowserStorage() {
    setStorageBusy(true);
    const status = await requestStoragePersistence();
    setStorageStatus(status);
    if (status === 'PERSISTENT') {
      notify('Persistent browser storage is enabled on this device.', 'success');
    } else if (status === 'BEST_EFFORT') {
      notify('The browser kept this site in best-effort storage. Continue creating encrypted backups.', 'error');
    } else {
      notify('This browser cannot enable persistent storage here. Continue creating encrypted backups.', 'error');
    }
    setStorageBusy(false);
  }

  async function createUser() {
    setBusy(true);
    try {
      await addLocalUser(newUser);
      setAddUserOpen(false);
      setNewUser({ displayName: '', username: '', role: 'PREPARER' });
      notify('Local user created.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to create local user.', 'error');
    } finally { setBusy(false); }
  }

  function openUser(user: LocalUser) {
    setEditingUser(user);
    setEditUserForm({ displayName: user.displayName, role: user.role, active: user.active });
  }

  async function saveUser() {
    if (!editingUser) return;
    setBusy(true);
    try {
      await updateLocalUser(editingUser.id, editUserForm);
      setEditingUser(undefined);
      notify('Local user updated.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to update local user.', 'error');
    } finally { setBusy(false); }
  }

  const updateSetup = <K extends keyof SetupFormState>(key: K, value: SetupFormState[K]) => {
    setTouchedSetupFields((current) => new Set(current).add(key));
    setSetup((current) => ({ ...current, [key]: value }));
  };
  const visibleError = (field: keyof SetupFormState) => touchedSetupFields.has(field) ? setupValidation.errors[field] : undefined;

  const storagePresentation: Record<StoragePersistenceStatus, { label: string; tone: 'green' | 'amber' | 'neutral'; body: string }> = {
    CHECKING: { label: 'CHECKING', tone: 'neutral', body: 'Checking whether this browser protects the local database from automatic storage eviction.' },
    PERSISTENT: { label: 'PERSISTENT', tone: 'green', body: 'This browser reports persistent storage. Data still disappears if site data is explicitly cleared.' },
    BEST_EFFORT: { label: 'BEST EFFORT', tone: 'amber', body: 'Companies survive normal reloads and updates here, but the browser may evict data under storage pressure.' },
    UNSUPPORTED: { label: 'NOT SUPPORTED', tone: 'neutral', body: 'This browser cannot report or request persistent storage. Encrypted backups are essential.' },
    UNAVAILABLE: { label: 'UNAVAILABLE', tone: 'neutral', body: 'Storage protection could not be checked. Encrypted backups are essential.' }
  };
  const storage = storagePresentation[storageStatus];

  return (
    <div className="page">
      <PageHeader eyebrow="Workspace master" title="Company setup" description="Create independent company workspaces and maintain legal identity, Division I framework, reporting period, materiality and local users." actions={<><button className="button button-secondary" onClick={openCreate}><Icon name="plus" size={16}/> New company</button><button className="button button-primary" onClick={openEdit}><Icon name="settings" size={16}/> Edit setup</button></>}/>
      <section className="setup-grid">
        <article className="panel setup-card setup-company"><div className="setup-card-heading"><span className="card-icon"><Icon name="company"/></span><StatusBadge tone="green">ACTIVE</StatusBadge></div><h2>{workspace.company.legalName}</h2><p>{workspace.company.registeredOffice}</p><dl><div><dt>CIN</dt><dd>{workspace.company.cin}</dd></div><div><dt>Industry</dt><dd>{workspace.company.industry}</dd></div><div><dt>Currency</dt><dd>Indian rupees (INR)</dd></div><div><dt>Presentation scale</dt><dd>{workspace.company.displayScale.toLowerCase()}</dd></div></dl></article>
        <article className="panel setup-card"><div className="setup-card-heading"><span className="card-icon"><Icon name="statements"/></span><StatusBadge tone="blue">DIVISION I</StatusBadge></div><h2>Reporting framework</h2><p>Validated taxonomy scope: standalone non-Ind AS commercial/industrial company. Division II, Division III and regulated-sector packs require separate validated modules.</p><dl><div><dt>Taxonomy</dt><dd>{workspace.period.taxonomyVersion}</dd></div><div><dt>Validation rules</dt><dd>{workspace.period.rulesetVersion}</dd></div><div><dt>Materiality</dt><dd>{formatMoney(workspace.period.materialityPaise, 'RUPEES')}</dd></div><div><dt>Consolidation</dt><dd>Not enabled</dd></div></dl></article>
        <article className="panel setup-card"><div className="setup-card-heading"><span className="card-icon"><Icon name="review"/></span><StatusBadge tone="amber">{workspace.period.status.replaceAll('_', ' ')}</StatusBadge></div><h2>{workspace.period.label}</h2><p>{new Date(`${workspace.period.startDate}T00:00:00`).toLocaleDateString('en-IN')} — {new Date(`${workspace.period.endDate}T00:00:00`).toLocaleDateString('en-IN')}</p><dl><div><dt>Comparative</dt><dd>{workspace.period.comparativeLabel}</dd></div><div><dt>Revision</dt><dd>{workspace.period.revision}</dd></div><div><dt>Active TB</dt><dd>{workspace.activeImport.fileName}</dd></div><div><dt>Imported rows</dt><dd>{workspace.activeImport.rowCount}</dd></div></dl></article>
      </section>
      <section className="panel users-panel"><div className="panel-heading"><div><span className="panel-kicker">Least-privilege roles</span><h2>Local users & review segregation</h2></div><button className="button button-secondary" onClick={() => setAddUserOpen(true)}><Icon name="plus" size={15}/> Add local user</button></div><div className="user-list">{workspace.users.map((user) => <div key={user.id}><span className="user-avatar">{user.displayName.split(' ').map((part) => part[0]).join('').slice(0,2)}</span><div><strong>{user.displayName}</strong><small>@{user.username}</small></div><StatusBadge tone={user.role === 'REVIEWER' ? 'blue' : user.role === 'ADMIN' ? 'neutral' : 'green'}>{user.role}</StatusBadge><span className={user.active ? 'positive' : 'negative'}>{user.active ? 'Active' : 'Inactive'}</span><button className="icon-button" onClick={() => openUser(user)} aria-label={`Edit ${user.displayName}`}><Icon name="settings"/></button></div>)}</div></section>
      <section className="setup-security-grid">
        <article className="panel">
          <Icon name="database"/>
          <div>
            <div className="storage-title"><h3>Browser-local database</h3><StatusBadge tone={storage.tone}>{storage.label}</StatusBadge></div>
            <p>{storage.body} Nothing is synchronised to another device automatically.</p>
            {(storageStatus === 'BEST_EFFORT' || storageStatus === 'UNAVAILABLE') && <button className="button button-secondary storage-action" disabled={storageBusy} onClick={() => void protectBrowserStorage()}>{storageBusy ? 'Requesting…' : 'Protect browser storage'}</button>}
          </div>
        </article>
        <article className="panel"><Icon name="wifi-off"/><div><h3>Offline ready</h3><p>After installation, the application shell and local data remain available without an Internet connection on this same browser profile.</p></div></article>
        <article className="panel"><Icon name="shield"/><div><h3>Recovery responsibility</h3><p>Browser storage is not an archive. Download encrypted backups after material work and before finalisation.</p><button className="button button-secondary storage-action" onClick={() => { window.location.hash = 'finalise'; }}>Open backup & restore</button></div></article>
      </section>

      {setupMode && <Modal title={setupMode === 'create' ? 'Create company workspace' : 'Edit company workspace'} description="This release validates Schedule III Division I for a standalone non-Ind AS commercial/industrial company." onClose={() => setSetupMode(undefined)} footer={<><button type="button" className="button button-secondary" disabled={busy} onClick={() => setSetupMode(undefined)}>Cancel</button><button type="submit" form="company-setup-form" className="button button-primary" disabled={busy || setupErrorCount > 0} title={setupErrorCount > 0 ? 'Complete or correct the highlighted company setup fields.' : undefined}>{busy ? 'Saving…' : setupMode === 'create' ? 'Create workspace' : 'Save setup'}</button></>}>
        {setupErrorCount > 0 && <div className="message-box message-warning setup-validation-summary"><Icon name="warning"/><div><strong>{setupErrorCount} setup field{setupErrorCount === 1 ? '' : 's'} require attention</strong><p>All fields are required. Correct a field to enable saving; field-level guidance appears after you edit it.</p></div></div>}
        <form id="company-setup-form" className="form-grid" noValidate onSubmit={submitSetup}>
          <label className={`field full-width ${visibleError('legalName') ? 'field-invalid' : ''}`}><span>Legal name *</span><input required maxLength={200} aria-invalid={Boolean(visibleError('legalName'))} value={setup.legalName} onChange={(event) => updateSetup('legalName', event.target.value)} placeholder="Example Company Private Limited"/>{visibleError('legalName') && <small className="field-error">{visibleError('legalName')}</small>}</label>
          <label className={`field ${visibleError('tradeName') ? 'field-invalid' : ''}`}><span>Trade / short name *</span><input required maxLength={80} aria-invalid={Boolean(visibleError('tradeName'))} value={setup.tradeName} onChange={(event) => updateSetup('tradeName', event.target.value)}/>{visibleError('tradeName') && <small className="field-error">{visibleError('tradeName')}</small>}</label>
          <label className={`field ${visibleError('cin') ? 'field-invalid' : ''}`}><span>CIN *</span><input required maxLength={CIN_LENGTH} minLength={CIN_LENGTH} inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} pattern="[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}" aria-invalid={Boolean(visibleError('cin'))} value={setup.cin} onChange={(event) => updateSetup('cin', normaliseCinInput(event.target.value))} placeholder="U00000XX0000XXX000000"/><small className={visibleError('cin') ? 'field-error' : undefined}>{visibleError('cin') ?? `${setup.cin.length}/${CIN_LENGTH} · L/U + 5 digits + state + year + type + 6 digits`}</small></label>
          <label className={`field full-width ${visibleError('registeredOffice') ? 'field-invalid' : ''}`}><span>Registered office *</span><input required maxLength={500} aria-invalid={Boolean(visibleError('registeredOffice'))} value={setup.registeredOffice} onChange={(event) => updateSetup('registeredOffice', event.target.value)}/>{visibleError('registeredOffice') && <small className="field-error">{visibleError('registeredOffice')}</small>}</label>
          <label className={`field ${visibleError('industry') ? 'field-invalid' : ''}`}><span>Industry *</span><input required maxLength={160} aria-invalid={Boolean(visibleError('industry'))} value={setup.industry} onChange={(event) => updateSetup('industry', event.target.value)}/>{visibleError('industry') && <small className="field-error">{visibleError('industry')}</small>}</label>
          <label className="field"><span>Presentation scale *</span><select required value={setup.displayScale} onChange={(event) => updateSetup('displayScale', event.target.value as SetupFormState['displayScale'])}><option value="RUPEES">Rupees</option><option value="THOUSANDS">Thousands</option><option value="LAKHS">Lakhs</option><option value="CRORES">Crores</option></select></label>
          <label className={`field ${visibleError('periodLabel') ? 'field-invalid' : ''}`}><span>Period label *</span><input required maxLength={40} aria-invalid={Boolean(visibleError('periodLabel'))} value={setup.periodLabel} onChange={(event) => updateSetup('periodLabel', event.target.value)}/>{visibleError('periodLabel') && <small className="field-error">{visibleError('periodLabel')}</small>}</label>
          <label className={`field ${visibleError('materialityRupees') ? 'field-invalid' : ''}`}><span>Materiality (INR) *</span><input required type="number" inputMode="decimal" min="0.01" step="0.01" aria-invalid={Boolean(visibleError('materialityRupees'))} value={setup.materialityRupees} onChange={(event) => updateSetup('materialityRupees', event.target.value)}/>{visibleError('materialityRupees') && <small className="field-error">{visibleError('materialityRupees')}</small>}</label>
          <label className={`field ${visibleError('startDate') ? 'field-invalid' : ''}`}><span>Period start *</span><input required type="date" aria-invalid={Boolean(visibleError('startDate'))} value={setup.startDate} onChange={(event) => updateSetup('startDate', event.target.value)}/>{visibleError('startDate') && <small className="field-error">{visibleError('startDate')}</small>}</label>
          <label className={`field ${visibleError('endDate') ? 'field-invalid' : ''}`}><span>Period end *</span><input required type="date" aria-invalid={Boolean(visibleError('endDate'))} value={setup.endDate} onChange={(event) => updateSetup('endDate', event.target.value)}/>{visibleError('endDate') && <small className="field-error">{visibleError('endDate')}</small>}</label>
          <label className={`field ${visibleError('comparativeLabel') ? 'field-invalid' : ''}`}><span>Comparative label *</span><input required maxLength={40} aria-invalid={Boolean(visibleError('comparativeLabel'))} value={setup.comparativeLabel} onChange={(event) => updateSetup('comparativeLabel', event.target.value)}/>{visibleError('comparativeLabel') && <small className="field-error">{visibleError('comparativeLabel')}</small>}</label><span/>
          <label className={`field ${visibleError('comparativeStartDate') ? 'field-invalid' : ''}`}><span>Comparative start *</span><input required type="date" aria-invalid={Boolean(visibleError('comparativeStartDate'))} value={setup.comparativeStartDate} onChange={(event) => updateSetup('comparativeStartDate', event.target.value)}/>{visibleError('comparativeStartDate') && <small className="field-error">{visibleError('comparativeStartDate')}</small>}</label>
          <label className={`field ${visibleError('comparativeEndDate') ? 'field-invalid' : ''}`}><span>Comparative end *</span><input required type="date" aria-invalid={Boolean(visibleError('comparativeEndDate'))} value={setup.comparativeEndDate} onChange={(event) => updateSetup('comparativeEndDate', event.target.value)}/>{visibleError('comparativeEndDate') && <small className="field-error">{visibleError('comparativeEndDate')}</small>}</label>
        </form>
      </Modal>}

      {addUserOpen && <Modal title="Add local user" description="Local roles are stored in this browser only. Production use requires a separately validated authentication and access-control deployment." onClose={() => setAddUserOpen(false)} footer={<><button className="button button-secondary" onClick={() => setAddUserOpen(false)}>Cancel</button><button className="button button-primary" disabled={busy} onClick={() => void createUser()}>{busy ? 'Creating…' : 'Create user'}</button></>}><div className="form-grid"><label className="field"><span>Display name</span><input value={newUser.displayName} onChange={(event) => setNewUser((current) => ({ ...current, displayName: event.target.value }))}/></label><label className="field"><span>Username</span><input value={newUser.username} onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}/></label><label className="field"><span>Role</span><select value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as LocalUser['role'] }))}><option value="PREPARER">Preparer</option><option value="REVIEWER">Reviewer</option><option value="VIEWER">Viewer</option><option value="ADMIN">Administrator</option></select></label></div></Modal>}

      {editingUser && <Modal title={`Edit ${editingUser.displayName}`} description={`Local username @${editingUser.username}`} onClose={() => setEditingUser(undefined)} footer={<><button className="button button-secondary" onClick={() => setEditingUser(undefined)}>Cancel</button><button className="button button-primary" disabled={busy} onClick={() => void saveUser()}>{busy ? 'Saving…' : 'Save user'}</button></>}><div className="form-grid"><label className="field"><span>Display name</span><input value={editUserForm.displayName} onChange={(event) => setEditUserForm((current) => ({ ...current, displayName: event.target.value }))}/></label><label className="field"><span>Role</span><select value={editUserForm.role} onChange={(event) => setEditUserForm((current) => ({ ...current, role: event.target.value as LocalUser['role'] }))}><option value="PREPARER">Preparer</option><option value="REVIEWER">Reviewer</option><option value="VIEWER">Viewer</option><option value="ADMIN">Administrator</option></select></label><label className="confirmation-check"><input type="checkbox" checked={editUserForm.active} onChange={(event) => setEditUserForm((current) => ({ ...current, active: event.target.checked }))}/><span>User is active in this browser workspace.</span></label></div></Modal>}
    </div>
  );
}

import { useState } from 'react';
import {
  addLocalUser,
  createCompanyWorkspace,
  updateCompanyWorkspace,
  updateLocalUser,
  type CompanyWorkspaceInput
} from '../db';
import { formatMoney, rupeesToPaise } from '../domain/money';
import type { LocalUser, WorkspaceData } from '../domain/types';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatusBadge } from '../components/ui';

interface SetupFormState extends Omit<CompanyWorkspaceInput, 'materialityPaise'> {
  materialityRupees: string;
}

const blankSetup = (): SetupFormState => ({
  legalName: '', tradeName: '', cin: '', registeredOffice: '', industry: '', displayScale: 'LAKHS',
  periodLabel: 'FY 2025–26', startDate: '2025-04-01', endDate: '2026-03-31',
  comparativeLabel: 'FY 2024–25', comparativeStartDate: '2024-04-01', comparativeEndDate: '2025-03-31',
  materialityRupees: '250000'
});

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
  const [busy, setBusy] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<{ displayName: string; username: string; role: LocalUser['role'] }>({ displayName: '', username: '', role: 'PREPARER' });
  const [editingUser, setEditingUser] = useState<LocalUser>();
  const [editUserForm, setEditUserForm] = useState<{ displayName: string; role: LocalUser['role']; active: boolean }>({ displayName: '', role: 'PREPARER', active: true });

  function openEdit() { setSetup(setupFromWorkspace(workspace)); setSetupMode('edit'); }
  function openCreate() { setSetup(blankSetup()); setSetupMode('create'); }
  function setupInput(): CompanyWorkspaceInput { return { ...setup, materialityPaise: rupeesToPaise(setup.materialityRupees) }; }

  async function saveSetup() {
    setBusy(true);
    try {
      if (setupMode === 'create') {
        const companyId = await createCompanyWorkspace(setupInput());
        setSetupMode(undefined);
        onCompanyCreated(companyId);
        notify('New company workspace created. Import its Trial Balance to begin.', 'success');
      } else {
        await updateCompanyWorkspace(workspace.company.id, workspace.period.id, setupInput());
        setSetupMode(undefined);
        notify('Company and reporting-period setup updated with an audit event.', 'success');
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save company setup.', 'error');
    } finally { setBusy(false); }
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

  const updateSetup = <K extends keyof SetupFormState>(key: K, value: SetupFormState[K]) => setSetup((current) => ({ ...current, [key]: value }));

  return (
    <div className="page">
      <PageHeader eyebrow="Workspace master" title="Company setup" description="Create independent company workspaces and maintain legal identity, Division I framework, reporting period, materiality and local users." actions={<><button className="button button-secondary" onClick={openCreate}><Icon name="plus" size={16}/> New company</button><button className="button button-primary" onClick={openEdit}><Icon name="settings" size={16}/> Edit setup</button></>}/>
      <section className="setup-grid">
        <article className="panel setup-card setup-company"><div className="setup-card-heading"><span className="card-icon"><Icon name="company"/></span><StatusBadge tone="green">ACTIVE</StatusBadge></div><h2>{workspace.company.legalName}</h2><p>{workspace.company.registeredOffice}</p><dl><div><dt>CIN</dt><dd>{workspace.company.cin}</dd></div><div><dt>Industry</dt><dd>{workspace.company.industry}</dd></div><div><dt>Currency</dt><dd>Indian rupees (INR)</dd></div><div><dt>Presentation scale</dt><dd>{workspace.company.displayScale.toLowerCase()}</dd></div></dl></article>
        <article className="panel setup-card"><div className="setup-card-heading"><span className="card-icon"><Icon name="statements"/></span><StatusBadge tone="blue">DIVISION I</StatusBadge></div><h2>Reporting framework</h2><p>Validated taxonomy scope: standalone non-Ind AS commercial/industrial company. Division II, Division III and regulated-sector packs require separate validated modules.</p><dl><div><dt>Taxonomy</dt><dd>{workspace.period.taxonomyVersion}</dd></div><div><dt>Validation rules</dt><dd>{workspace.period.rulesetVersion}</dd></div><div><dt>Materiality</dt><dd>{formatMoney(workspace.period.materialityPaise, 'RUPEES')}</dd></div><div><dt>Consolidation</dt><dd>Not enabled</dd></div></dl></article>
        <article className="panel setup-card"><div className="setup-card-heading"><span className="card-icon"><Icon name="review"/></span><StatusBadge tone="amber">{workspace.period.status.replaceAll('_', ' ')}</StatusBadge></div><h2>{workspace.period.label}</h2><p>{new Date(`${workspace.period.startDate}T00:00:00`).toLocaleDateString('en-IN')} — {new Date(`${workspace.period.endDate}T00:00:00`).toLocaleDateString('en-IN')}</p><dl><div><dt>Comparative</dt><dd>{workspace.period.comparativeLabel}</dd></div><div><dt>Revision</dt><dd>{workspace.period.revision}</dd></div><div><dt>Active TB</dt><dd>{workspace.activeImport.fileName}</dd></div><div><dt>Imported rows</dt><dd>{workspace.activeImport.rowCount}</dd></div></dl></article>
      </section>
      <section className="panel users-panel"><div className="panel-heading"><div><span className="panel-kicker">Least-privilege roles</span><h2>Local users & review segregation</h2></div><button className="button button-secondary" onClick={() => setAddUserOpen(true)}><Icon name="plus" size={15}/> Add local user</button></div><div className="user-list">{workspace.users.map((user) => <div key={user.id}><span className="user-avatar">{user.displayName.split(' ').map((part) => part[0]).join('').slice(0,2)}</span><div><strong>{user.displayName}</strong><small>@{user.username}</small></div><StatusBadge tone={user.role === 'REVIEWER' ? 'blue' : user.role === 'ADMIN' ? 'neutral' : 'green'}>{user.role}</StatusBadge><span className={user.active ? 'positive' : 'negative'}>{user.active ? 'Active' : 'Inactive'}</span><button className="icon-button" onClick={() => openUser(user)} aria-label={`Edit ${user.displayName}`}><Icon name="settings"/></button></div>)}</div></section>
      <section className="setup-security-grid"><article className="panel"><Icon name="database"/><div><h3>Browser-local database</h3><p>Each company has an independent workspace in this browser profile. Nothing is synchronised automatically.</p></div></article><article className="panel"><Icon name="wifi-off"/><div><h3>Offline ready</h3><p>After installation, the application shell and local data remain available without an Internet connection.</p></div></article><article className="panel"><Icon name="shield"/><div><h3>Recovery responsibility</h3><p>Browser storage is not an archive. Download encrypted backups after material work and before finalisation.</p></div></article></section>

      {setupMode && <Modal title={setupMode === 'create' ? 'Create company workspace' : 'Edit company workspace'} description="This release validates Schedule III Division I for a standalone non-Ind AS commercial/industrial company." onClose={() => setSetupMode(undefined)} footer={<><button className="button button-secondary" disabled={busy} onClick={() => setSetupMode(undefined)}>Cancel</button><button className="button button-primary" disabled={busy} onClick={() => void saveSetup()}>{busy ? 'Saving…' : setupMode === 'create' ? 'Create workspace' : 'Save setup'}</button></>}>
        <div className="form-grid">
          <label className="field full-width"><span>Legal name</span><input value={setup.legalName} onChange={(event) => updateSetup('legalName', event.target.value)} placeholder="Example Company Private Limited"/></label>
          <label className="field"><span>Trade / short name</span><input value={setup.tradeName} onChange={(event) => updateSetup('tradeName', event.target.value)}/></label>
          <label className="field"><span>CIN</span><input value={setup.cin} onChange={(event) => updateSetup('cin', event.target.value)} placeholder="U00000XX0000XXX000000"/></label>
          <label className="field full-width"><span>Registered office</span><input value={setup.registeredOffice} onChange={(event) => updateSetup('registeredOffice', event.target.value)}/></label>
          <label className="field"><span>Industry</span><input value={setup.industry} onChange={(event) => updateSetup('industry', event.target.value)}/></label>
          <label className="field"><span>Presentation scale</span><select value={setup.displayScale} onChange={(event) => updateSetup('displayScale', event.target.value as SetupFormState['displayScale'])}><option value="RUPEES">Rupees</option><option value="THOUSANDS">Thousands</option><option value="LAKHS">Lakhs</option><option value="CRORES">Crores</option></select></label>
          <label className="field"><span>Period label</span><input value={setup.periodLabel} onChange={(event) => updateSetup('periodLabel', event.target.value)}/></label>
          <label className="field"><span>Materiality (INR)</span><input type="number" min="0.01" step="0.01" value={setup.materialityRupees} onChange={(event) => updateSetup('materialityRupees', event.target.value)}/></label>
          <label className="field"><span>Period start</span><input type="date" value={setup.startDate} onChange={(event) => updateSetup('startDate', event.target.value)}/></label>
          <label className="field"><span>Period end</span><input type="date" value={setup.endDate} onChange={(event) => updateSetup('endDate', event.target.value)}/></label>
          <label className="field"><span>Comparative label</span><input value={setup.comparativeLabel} onChange={(event) => updateSetup('comparativeLabel', event.target.value)}/></label><span/>
          <label className="field"><span>Comparative start</span><input type="date" value={setup.comparativeStartDate} onChange={(event) => updateSetup('comparativeStartDate', event.target.value)}/></label>
          <label className="field"><span>Comparative end</span><input type="date" value={setup.comparativeEndDate} onChange={(event) => updateSetup('comparativeEndDate', event.target.value)}/></label>
        </div>
      </Modal>}

      {addUserOpen && <Modal title="Add local user" description="Local roles are stored in this browser only. Production use requires a separately validated authentication and access-control deployment." onClose={() => setAddUserOpen(false)} footer={<><button className="button button-secondary" onClick={() => setAddUserOpen(false)}>Cancel</button><button className="button button-primary" disabled={busy} onClick={() => void createUser()}>{busy ? 'Creating…' : 'Create user'}</button></>}><div className="form-grid"><label className="field"><span>Display name</span><input value={newUser.displayName} onChange={(event) => setNewUser((current) => ({ ...current, displayName: event.target.value }))}/></label><label className="field"><span>Username</span><input value={newUser.username} onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}/></label><label className="field"><span>Role</span><select value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as LocalUser['role'] }))}><option value="PREPARER">Preparer</option><option value="REVIEWER">Reviewer</option><option value="VIEWER">Viewer</option><option value="ADMIN">Administrator</option></select></label></div></Modal>}

      {editingUser && <Modal title={`Edit ${editingUser.displayName}`} description={`Local username @${editingUser.username}`} onClose={() => setEditingUser(undefined)} footer={<><button className="button button-secondary" onClick={() => setEditingUser(undefined)}>Cancel</button><button className="button button-primary" disabled={busy} onClick={() => void saveUser()}>{busy ? 'Saving…' : 'Save user'}</button></>}><div className="form-grid"><label className="field"><span>Display name</span><input value={editUserForm.displayName} onChange={(event) => setEditUserForm((current) => ({ ...current, displayName: event.target.value }))}/></label><label className="field"><span>Role</span><select value={editUserForm.role} onChange={(event) => setEditUserForm((current) => ({ ...current, role: event.target.value as LocalUser['role'] }))}><option value="PREPARER">Preparer</option><option value="REVIEWER">Reviewer</option><option value="VIEWER">Viewer</option><option value="ADMIN">Administrator</option></select></label><label className="confirmation-check"><input type="checkbox" checked={editUserForm.active} onChange={(event) => setEditUserForm((current) => ({ ...current, active: event.target.checked }))}/><span>User is active in this browser workspace.</span></label></div></Modal>}
    </div>
  );
}

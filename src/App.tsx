import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { listCompanyWorkspaces, loadWorkspace } from './db';
import { taxonomy } from './data/taxonomy';
import { calculateFinancialStatements, calculateKpis } from './domain/statements';
import { validateWorkspace } from './domain/validation';
import type { ValidationResult } from './domain/types';
import { Icon, type IconName } from './components/Icon';
import { Modal, StatusBadge } from './components/ui';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then((module) => ({ default: module.OverviewPage })));
const CompanyPage = lazy(() => import('./pages/CompanyPage').then((module) => ({ default: module.CompanyPage })));
const TrialBalancePage = lazy(() => import('./pages/TrialBalancePage').then((module) => ({ default: module.TrialBalancePage })));
const MappingPage = lazy(() => import('./pages/MappingPage').then((module) => ({ default: module.MappingPage })));
const AdjustmentsPage = lazy(() => import('./pages/AdjustmentsPage').then((module) => ({ default: module.AdjustmentsPage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((module) => ({ default: module.ReviewPage })));
const StatementsPage = lazy(() => import('./pages/StatementsPage').then((module) => ({ default: module.StatementsPage })));
const NotesPage = lazy(() => import('./pages/NotesPage').then((module) => ({ default: module.NotesPage })));
const RatiosPage = lazy(() => import('./pages/RatiosPage').then((module) => ({ default: module.RatiosPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const FinalisationPage = lazy(() => import('./pages/FinalisationPage').then((module) => ({ default: module.FinalisationPage })));

type PageId = 'overview' | 'company' | 'trial-balance' | 'mapping' | 'adjustments' | 'review' | 'statements' | 'notes' | 'ratios' | 'reports' | 'finalise';

const navItems: Array<{ id: PageId; label: string; icon: IconName; group?: string }> = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'company', label: 'Company setup', icon: 'company', group: 'PREPARATION' },
  { id: 'trial-balance', label: 'Trial Balance', icon: 'trial-balance' },
  { id: 'mapping', label: 'Mapping', icon: 'mapping' },
  { id: 'adjustments', label: 'Adjustments', icon: 'adjustments' },
  { id: 'review', label: 'Review & validation', icon: 'review', group: 'REPORTING' },
  { id: 'statements', label: 'Financial statements', icon: 'statements' },
  { id: 'notes', label: 'Notes & policies', icon: 'notes' },
  { id: 'ratios', label: 'Ratios & analytics', icon: 'ratios' },
  { id: 'reports', label: 'Board & bank packs', icon: 'reports' },
  { id: 'finalise', label: 'Finalisation', icon: 'finalise', group: 'CONTROL' }
];

function currentHash(): PageId {
  const value = window.location.hash.replace(/^#\/?/, '') as PageId;
  return navItems.some((item) => item.id === value) ? value : 'overview';
}

export default function App() {
  const [activeCompanyId, setActiveCompanyId] = useState(() => localStorage.getItem('white-horse-active-company') ?? 'demo-company');
  const companies = useLiveQuery(() => listCompanyWorkspaces(), []);
  const workspace = useLiveQuery(() => loadWorkspace(activeCompanyId), [activeCompanyId]);
  const [page, setPage] = useState<PageId>(currentHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' }>();
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW();

  useEffect(() => {
    const onHash = () => setPage(currentHash());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!companies?.length || companies.some((company) => company.companyId === activeCompanyId)) return;
    let cancelled = false;
    void loadWorkspace(activeCompanyId).then((selectedWorkspace) => {
      if (cancelled || selectedWorkspace) return;
      const fallback = companies[0]?.companyId;
      if (fallback) {
        localStorage.setItem('white-horse-active-company', fallback);
        setActiveCompanyId(fallback);
      }
    });
    return () => { cancelled = true; };
  }, [companies, activeCompanyId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 4_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const computed = useMemo(() => {
    if (!workspace) return undefined;
    const context = {
      period: workspace.period,
      ledgers: workspace.ledgers,
      mappings: workspace.mappings,
      adjustments: workspace.adjustments,
      adjustmentLines: workspace.adjustmentLines,
      taxonomy
    };
    const statements = calculateFinancialStatements(context);
    const kpis = calculateKpis(context, statements);
    const automated = validateWorkspace(context);
    const persistedKeys = new Set(workspace.validations.map((item) => `${item.ruleId}:${item.entityId ?? 'workspace'}`));
    const validations: ValidationResult[] = [
      ...workspace.validations,
      ...automated.filter((item) => !persistedKeys.has(`${item.ruleId}:${item.entityId ?? 'workspace'}`))
    ];
    return { statements, kpis, validations };
  }, [workspace]);

  function navigate(id: string) {
    window.location.hash = id;
    setSidebarOpen(false);
  }

  function selectCompany(companyId: string) {
    localStorage.setItem('white-horse-active-company', companyId);
    setActiveCompanyId(companyId);
    setCompanySwitcherOpen(false);
    navigate('overview');
  }

  function notify(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
  }

  if (workspace === undefined || computed === undefined || companies === undefined) {
    return <div className="app-loading"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt="White Horse"/><strong>Preparing your local workspace…</strong><span>Opening the browser-local data layer</span></div>;
  }

  const preparer = workspace.users.find((user) => user.active && user.role === 'PREPARER') ?? workspace.users.find((user) => user.active) ?? workspace.users[0];
  const preparerName = preparer?.displayName ?? 'Abhijit';
  const preparerInitials = preparerName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const companyInitials = workspace.company.tradeName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const openNotifications = computed.validations.filter((item) => item.status === 'OPEN');
  const searchableItems = [
    ...navItems.map((item) => ({ id: `page-${item.id}`, label: item.label, detail: 'Application page', page: item.id })),
    ...workspace.ledgers.map((ledger) => ({ id: `ledger-${ledger.id}`, label: `${ledger.code} · ${ledger.name}`, detail: `${ledger.group} / ${ledger.subGroup || 'No subgroup'}`, page: 'trial-balance' as PageId })),
    ...workspace.notes.map((note) => ({ id: `note-${note.id}`, label: `Note ${note.noteNumber} · ${note.title}`, detail: note.status.replaceAll('_', ' '), page: 'notes' as PageId }))
  ].filter((item) => !searchQuery.trim() || `${item.label} ${item.detail}`.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 20);

  const pageProps = { workspace, notify };
  const content = {
    overview: <OverviewPage workspace={workspace} statements={computed.statements} kpis={computed.kpis} validations={computed.validations} navigate={navigate} notify={notify} preparerName={preparerName}/>,
    company: <CompanyPage workspace={workspace} notify={notify} onCompanyCreated={selectCompany}/>,
    'trial-balance': <TrialBalancePage {...pageProps}/>,
    mapping: <MappingPage {...pageProps}/>,
    adjustments: <AdjustmentsPage {...pageProps}/>,
    review: <ReviewPage workspace={workspace} statements={computed.statements} validations={computed.validations} notify={notify} navigate={navigate}/>,
    statements: <StatementsPage workspace={workspace} statements={computed.statements} kpis={computed.kpis} validations={computed.validations} notify={notify}/>,
    notes: <NotesPage {...pageProps} statements={computed.statements}/>,
    ratios: <RatiosPage workspace={workspace} statements={computed.statements} kpis={computed.kpis} notify={notify}/>,
    reports: <ReportsPage workspace={workspace} statements={computed.statements} kpis={computed.kpis} validations={computed.validations} notify={notify}/>,
    finalise: <FinalisationPage workspace={workspace} statements={computed.statements} validations={computed.validations} notify={notify}/>
  } satisfies Record<PageId, React.ReactNode>;

  return (
    <div className="app-shell">
      <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation"><Icon name="overview"/></button>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt=""/><div><strong>WHITE HORSE</strong><span>Financial reporting</span></div></div>
        <nav aria-label="Primary navigation">
          {navItems.map((item, index) => (
            <div key={item.id}>
              {item.group && <span className="nav-group">{item.group}</span>}
              <button className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)}>
                <Icon name={item.icon}/><span>{item.label}</span>
                {item.id === 'review' && computed.validations.some((result) => result.status === 'OPEN' && result.severity === 'WARNING') && <em>{computed.validations.filter((result) => result.status === 'OPEN' && result.severity === 'WARNING').length}</em>}
              </button>
              {index === 0 && <div className="nav-divider"/>}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="local-only"><Icon name="database" size={15}/><span><strong>Local-only data</strong><small>{online ? 'App connected · data stays here' : 'Offline mode active'}</small></span></div>
          <button className="user-menu" onClick={() => setUserOpen(true)}><span className="user-avatar">{preparerInitials}</span><span><strong>{preparerName}</strong><small>{preparer?.role.toLowerCase() ?? 'preparer'}</small></span><Icon name="more" size={16}/></button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button className="company-switcher" onClick={() => setCompanySwitcherOpen(true)}><span className="company-monogram">{companyInitials}</span><span className="company-switcher-copy"><strong>{workspace.company.tradeName}</strong><small>{workspace.period.label} · Standalone · Division I</small></span><Icon name="chevron" size={15}/></button>
          <div className="topbar-right"><StatusBadge tone={online ? 'green' : 'amber'}>{online ? 'ONLINE · LOCAL DATA' : 'OFFLINE READY'}</StatusBadge><button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Icon name="search"/></button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotificationOpen(true)}><Icon name="bell"/>{openNotifications.length > 0 && <i/>}</button></div>
        </header>
        <main><Suspense fallback={<div className="page route-loading"><strong>Opening workspace module…</strong><span>Loading only the controls needed for this page.</span></div>}>{content[page]}</Suspense></main>
      </div>
      {companySwitcherOpen && <Modal title="Switch company workspace" description="Each company and reporting period is stored independently in this browser." onClose={() => setCompanySwitcherOpen(false)} footer={<button className="button button-primary" onClick={() => { setCompanySwitcherOpen(false); navigate('company'); }}>Manage or create companies</button>}><div className="workspace-switch-list">{companies.map((company) => <button key={company.companyId} className={company.companyId === workspace.company.id ? 'active' : ''} onClick={() => selectCompany(company.companyId)}><span className="company-monogram">{company.tradeName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span><strong>{company.tradeName}</strong><small>{company.legalName} · {company.periodLabel}</small></span><StatusBadge tone={company.companyId === workspace.company.id ? 'green' : 'neutral'}>{company.companyId === workspace.company.id ? 'CURRENT' : company.status.replaceAll('_', ' ')}</StatusBadge></button>)}</div></Modal>}
      {searchOpen && <Modal title="Search workspace" description="Find a page, Trial Balance ledger or disclosure note." onClose={() => { setSearchOpen(false); setSearchQuery(''); }}><label className="search-field global-search"><Icon name="search" size={16}/><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search pages, ledgers and notes…"/></label><div className="global-search-results">{searchableItems.map((item) => <button key={item.id} onClick={() => { navigate(item.page); setSearchOpen(false); setSearchQuery(''); }}><span><strong>{item.label}</strong><small>{item.detail}</small></span><Icon name="chevron" size={15}/></button>)}{searchableItems.length === 0 && <p>No matching page, ledger or note was found.</p>}</div></Modal>}
      {notificationOpen && <Modal title="Review notifications" description={`${openNotifications.length} open validation result${openNotifications.length === 1 ? '' : 's'} for ${workspace.company.tradeName}.`} onClose={() => setNotificationOpen(false)} footer={<button className="button button-primary" onClick={() => { setNotificationOpen(false); navigate('review'); }}>Open review centre</button>}><div className="notification-list">{openNotifications.slice(0, 10).map((item) => <button key={item.id} onClick={() => { setNotificationOpen(false); navigate('review'); }}><span className={`attention-icon severity-${item.severity.toLowerCase()}`}><Icon name={item.severity === 'INFO' ? 'info' : item.severity === 'WARNING' ? 'warning' : 'error'} size={16}/></span><span><strong>{item.title}</strong><small>{item.ruleId} · {item.severity}</small></span><Icon name="chevron" size={15}/></button>)}{openNotifications.length === 0 && <div className="empty-list"><Icon name="check" size={24}/><h3>No open notifications</h3><p>The current validation view has no open results.</p></div>}</div></Modal>}
      {userOpen && <Modal title={preparerName} description="Active local workspace identity" onClose={() => setUserOpen(false)} footer={<button className="button button-primary" onClick={() => { setUserOpen(false); navigate('company'); }}>Manage local users</button>}><div className="profile-summary"><span className="user-avatar profile-avatar">{preparerInitials}</span><div><strong>{preparerName}</strong><p>@{preparer?.username ?? 'abhijit'} · {preparer?.role ?? 'PREPARER'}</p><small>This identity is browser-local and is not connected to your GitHub account or contacts.</small></div></div></Modal>}
      {toast && <div className={`toast toast-${toast.tone}`} role="status"><Icon name={toast.tone === 'success' ? 'check' : 'error'} size={17}/><span>{toast.message}</span><button onClick={() => setToast(undefined)} aria-label="Dismiss"><Icon name="close" size={14}/></button></div>}
      {(offlineReady || needRefresh) && <div className="update-toast"><Icon name={offlineReady ? 'wifi-off' : 'info'}/><div><strong>{offlineReady ? 'White Horse is ready offline' : 'A verified update is available'}</strong><span>{offlineReady ? 'The application shell is cached on this device.' : 'Update after saving or exporting current work.'}</span></div>{needRefresh && <button className="button button-primary" onClick={() => void updateServiceWorker(true)}>Update</button>}<button className="icon-button" onClick={() => { setOfflineReady(false); setNeedRefresh(false); }}><Icon name="close"/></button></div>}
    </div>
  );
}

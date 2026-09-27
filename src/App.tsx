import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { loadDemoWorkspace } from './db';
import { taxonomy } from './data/taxonomy';
import { calculateFinancialStatements, calculateKpis } from './domain/statements';
import { validateWorkspace } from './domain/validation';
import type { ValidationResult } from './domain/types';
import { Icon, type IconName } from './components/Icon';
import { StatusBadge } from './components/ui';
import { OverviewPage } from './pages/OverviewPage';
import { CompanyPage } from './pages/CompanyPage';
import { TrialBalancePage } from './pages/TrialBalancePage';
import { MappingPage } from './pages/MappingPage';
import { AdjustmentsPage } from './pages/AdjustmentsPage';
import { ReviewPage } from './pages/ReviewPage';
import { StatementsPage } from './pages/StatementsPage';
import { NotesPage } from './pages/NotesPage';
import { RatiosPage } from './pages/RatiosPage';
import { ReportsPage } from './pages/ReportsPage';
import { FinalisationPage } from './pages/FinalisationPage';

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
  const workspace = useLiveQuery(() => loadDemoWorkspace(), []);
  const [page, setPage] = useState<PageId>(currentHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' }>();
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

  function notify(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
  }

  if (workspace === undefined || computed === undefined) {
    return <div className="app-loading"><img src={`${import.meta.env.BASE_URL}white-horse.svg`} alt="White Horse"/><strong>Preparing your local workspace…</strong><span>Opening the encrypted-browser data layer</span></div>;
  }

  const pageProps = { workspace, notify };
  const content = {
    overview: <OverviewPage workspace={workspace} statements={computed.statements} kpis={computed.kpis} validations={computed.validations} navigate={navigate}/>,
    company: <CompanyPage workspace={workspace}/>,
    'trial-balance': <TrialBalancePage {...pageProps}/>,
    mapping: <MappingPage {...pageProps}/>,
    adjustments: <AdjustmentsPage {...pageProps}/>,
    review: <ReviewPage workspace={workspace} statements={computed.statements} validations={computed.validations} notify={notify} navigate={navigate}/>,
    statements: <StatementsPage workspace={workspace} statements={computed.statements} kpis={computed.kpis} validations={computed.validations} notify={notify}/>,
    notes: <NotesPage {...pageProps}/>,
    ratios: <RatiosPage workspace={workspace} statements={computed.statements} kpis={computed.kpis}/>,
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
          <button className="user-menu"><span className="user-avatar">AM</span><span><strong>Aarav Mehta</strong><small>Preparer</small></span><Icon name="more" size={16}/></button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="company-switcher"><span className="company-monogram">SI</span><div><strong>{workspace.company.tradeName}</strong><small>{workspace.period.label} · Standalone</small></div><Icon name="chevron" size={15}/></div>
          <div className="topbar-right"><StatusBadge tone={online ? 'green' : 'amber'}>{online ? 'ONLINE · LOCAL DATA' : 'OFFLINE READY'}</StatusBadge><button className="icon-button" aria-label="Search"><Icon name="search"/></button><button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell"/><i/></button></div>
        </header>
        <main>{content[page]}</main>
      </div>
      {toast && <div className={`toast toast-${toast.tone}`} role="status"><Icon name={toast.tone === 'success' ? 'check' : 'error'} size={17}/><span>{toast.message}</span><button onClick={() => setToast(undefined)} aria-label="Dismiss"><Icon name="close" size={14}/></button></div>}
      {(offlineReady || needRefresh) && <div className="update-toast"><Icon name={offlineReady ? 'wifi-off' : 'info'}/><div><strong>{offlineReady ? 'White Horse is ready offline' : 'A verified update is available'}</strong><span>{offlineReady ? 'The application shell is cached on this device.' : 'Update after saving or exporting current work.'}</span></div>{needRefresh && <button className="button button-primary" onClick={() => void updateServiceWorker(true)}>Update</button>}<button className="icon-button" onClick={() => { setOfflineReady(false); setNeedRefresh(false); }}><Icon name="close"/></button></div>}
    </div>
  );
}

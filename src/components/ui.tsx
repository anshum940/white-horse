import type { ReactNode } from 'react';
import { formatMoney, variancePercent } from '../domain/money';
import type { DisplayScale } from '../domain/money';
import type { ReportLine, Severity } from '../domain/types';
import { Icon, type IconName } from './Icon';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
export function StatusBadge({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'blue' | 'neutral'; children: ReactNode }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone = severity === 'BLOCKING' || severity === 'ERROR' ? 'red' : severity === 'WARNING' ? 'amber' : 'blue';
  return <StatusBadge tone={tone}>{severity}</StatusBadge>;
}

export function MetricCard({
  label,
  value,
  comparative,
  icon,
  tone = 'default',
  suffix
}: {
  label: string;
  value: number;
  comparative?: number;
  icon: IconName;
  tone?: 'default' | 'emerald' | 'sand' | 'rose';
  suffix?: string;
}) {
  const variance = comparative === undefined ? null : variancePercent(value, comparative);
  const positive = variance !== null && variance >= 0;
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-topline">
        <span className="metric-label">{label}</span>
        <span className="metric-icon"><Icon name={icon} size={17} /></span>
      </div>
      <strong className="metric-value">{suffix ? `${value.toFixed(2)}${suffix}` : formatMoney(value, 'LAKHS')}</strong>
      {comparative !== undefined && (
        <div className={`metric-variance ${positive ? 'positive' : 'negative'}`}>
          <Icon name={positive ? 'arrow-up' : 'arrow-down'} size={13} />
          <span>{variance === null ? 'New' : `${Math.abs(variance).toFixed(1)}%`}</span>
          <small>vs prior year</small>
        </div>
      )}
    </article>
  );
}

export function ProgressBar({ value, tone = 'green' }: { value: number; tone?: 'green' | 'amber' | 'red' | 'blue' }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" aria-label={`${bounded}% complete`}>
      <span className={`progress-fill progress-${tone}`} style={{ width: `${bounded}%` }} />
    </div>
  );
}

export function TrendBars({ current, comparative, labels = ['Prior', 'Current'] }: { current: number; comparative: number; labels?: [string, string] }) {
  const max = Math.max(Math.abs(current), Math.abs(comparative), 1);
  return (
    <div className="trend-bars" aria-label={`${labels[0]} ${comparative}, ${labels[1]} ${current}`}>
      <div className="trend-column">
        <span className="trend-value">{formatMoney(comparative, 'LAKHS')}</span>
        <span className="trend-bar trend-prior" style={{ height: `${Math.max(8, (Math.abs(comparative) / max) * 100)}%` }} />
        <small>{labels[0]}</small>
      </div>
      <div className="trend-column">
        <span className="trend-value">{formatMoney(current, 'LAKHS')}</span>
        <span className="trend-bar trend-current" style={{ height: `${Math.max(8, (Math.abs(current) / max) * 100)}%` }} />
        <small>{labels[1]}</small>
      </div>
    </div>
  );
}

export function StatementTable({
  lines,
  currentLabel,
  comparativeLabel,
  scale = 'LAKHS',
  onDrilldown
}: {
  lines: ReportLine[];
  currentLabel: string;
  comparativeLabel: string;
  scale?: DisplayScale;
  onDrilldown?: (line: ReportLine) => void;
}) {
  return (
    <div className="statement-table-wrap">
      <table className="statement-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="note-column">Note</th>
            <th className="amount-column">{currentLabel}</th>
            <th className="amount-column">{comparativeLabel}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.code} className={`statement-${line.kind.toLowerCase()}`}>
              <td>
                {line.kind === 'LINE' || line.kind === 'CALCULATED' ? (
                  <button className="drilldown-button" onClick={() => onDrilldown?.(line)} disabled={!line.ledgerIds.length}>
                    <span>{line.label}</span>
                    {line.ledgerIds.length > 0 && <Icon name="chevron" size={14} />}
                  </button>
                ) : (
                  line.label
                )}
              </td>
              <td className="note-column">{line.noteNumber ?? ''}</td>
              <td className="amount-column">{line.kind === 'SECTION' ? '' : formatMoney(line.currentPaise, scale, { showZero: false })}</td>
              <td className="amount-column">{line.kind === 'SECTION' ? '' : formatMoney(line.comparativePaise, scale, { showZero: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Modal({ title, description, children, onClose, footer }: { title: string; description?: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

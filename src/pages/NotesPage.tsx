import { useEffect, useMemo, useState } from 'react';
import { updateNoteDisclosure } from '../db';
import { formatMoney } from '../domain/money';
import type { FinancialStatements, NoteDisclosure, WorkspaceData } from '../domain/types';
import { Icon } from '../components/Icon';
import { PageHeader, ProgressBar, StatusBadge } from '../components/ui';

export function NotesPage({ workspace, statements, notify }: { workspace: WorkspaceData; statements: FinancialStatements; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const sorted = useMemo(() => [...workspace.notes].sort((a, b) => Number(a.noteNumber) - Number(b.noteNumber)), [workspace.notes]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? '');
  const selected = sorted.find((note) => note.id === selectedId) ?? sorted[0];
  const [narrative, setNarrative] = useState(selected?.narrative ?? '');
  const [status, setStatus] = useState<NoteDisclosure['status']>(selected?.status ?? 'PENDING');
  const [checklist, setChecklist] = useState<[boolean, boolean, boolean]>([true, selected?.status === 'COMPLETE', selected?.status === 'COMPLETE']);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNarrative(selected?.narrative ?? ''); setStatus(selected?.status ?? 'PENDING'); setChecklist([true, selected?.status === 'COMPLETE', selected?.status === 'COMPLETE']); }, [selected?.id, selected?.narrative, selected?.status]);
  const complete = workspace.notes.filter((note) => note.status === 'COMPLETE').length;
  const percent = workspace.notes.length ? (complete / workspace.notes.length) * 100 : 0;
  const filtered = sorted.filter((note) => !search.trim() || `${note.noteNumber} ${note.title} ${note.owner}`.toLowerCase().includes(search.trim().toLowerCase()));
  const statementLines = [...statements.balanceSheet, ...statements.profitAndLoss];
  const mappedLines = selected ? selected.taxonomyCodes.map((code) => statementLines.find((line) => line.code === code)).filter((line) => line !== undefined) : [];

  async function save() {
    if (!selected) return;
    if (status === 'COMPLETE' && !checklist.every(Boolean)) {
      notify('Complete all three review checks before marking a note complete.', 'error');
      return;
    }
    setBusy(true);
    try {
      await updateNoteDisclosure(selected.id, { narrative, status });
      notify(`Note ${selected.noteNumber} saved with an audit event.`, 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to save note.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Statements ↔ disclosures" title="Notes & accounting policies" description="Complete structured notes, cross-references and policies without breaking face-statement reconciliation." actions={<button className="button button-primary" disabled={!selected || busy} onClick={() => void save()}><Icon name="check" size={16}/> {busy ? 'Saving…' : 'Save note'}</button>}/>
      <section className="notes-progress panel"><div><span>Disclosure completion</span><strong>{complete} of {workspace.notes.length} complete</strong></div><ProgressBar value={percent} tone={percent === 100 ? 'green' : 'amber'}/><em>{Math.round(percent)}%</em></section>
      <section className="notes-workspace">
        <aside className="panel notes-list">
          <div className="notes-list-header"><h2>Notes index</h2><label className="notes-search"><Icon name="search" size={14}/><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search notes" placeholder="Search…"/></label></div>
          {filtered.map((note) => <button key={note.id} className={selected?.id === note.id ? 'active' : ''} onClick={() => setSelectedId(note.id)}><span className="note-number">{note.noteNumber}</span><span><strong>{note.title}</strong><small>{note.owner}</small></span><StatusBadge tone={note.status === 'COMPLETE' ? 'green' : note.status === 'PENDING' ? 'red' : note.status === 'IN_REVIEW' ? 'amber' : 'neutral'}>{note.status.replace('_', ' ')}</StatusBadge></button>)}
          {filtered.length === 0 && <div className="empty-list"><p>No matching disclosure note.</p></div>}
        </aside>
        {selected && <article className="panel note-editor">
          <header><div><span className="eyebrow">Note {selected.noteNumber}</span><h2>{selected.title}</h2><p>Last updated {new Date(selected.updatedAt).toLocaleDateString('en-IN')} · Owner {selected.owner}</p></div><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as NoteDisclosure['status'])}><option value="PENDING">Pending</option><option value="IN_REVIEW">In review</option><option value="COMPLETE">Complete</option><option value="NOT_APPLICABLE">Not applicable</option></select></label></header>
          {selected.taxonomyCodes.length > 0 && <div className="cross-reference"><Icon name="mapping" size={16}/><span><strong>Mapped statement heads:</strong> {selected.taxonomyCodes.join(', ')}</span></div>}
          {mappedLines.length > 0 && <div className="table-scroll note-amounts"><table className="data-table"><thead><tr><th>Statement head</th><th className="amount-column">{workspace.period.label}</th><th className="amount-column">{workspace.period.comparativeLabel}</th></tr></thead><tbody>{mappedLines.map((line) => <tr key={line.code}><td>{line.label}</td><td className="amount-column">{formatMoney(line.currentPaise, workspace.company.displayScale)}</td><td className="amount-column">{formatMoney(line.comparativePaise, workspace.company.displayScale)}</td></tr>)}</tbody></table></div>}
          <label className="editor-label"><span>Disclosure narrative / workpaper summary</span><textarea value={narrative} onChange={(event) => setNarrative(event.target.value)} rows={12}/></label>
          <div className="editor-guidance"><Icon name="info" size={16}/><div><strong>Professional judgement required</strong><p>White Horse preserves the note structure and mapped totals. The preparer remains responsible for applicable legal and accounting-standard disclosures.</p></div></div>
          <section className="note-checklist"><h3>Review checklist</h3>{['Mapped total agrees to the face statement before rounding', 'Current and comparative disclosures are complete', 'Reviewer evidence and conclusion are documented'].map((label, index) => <label key={label}><input type="checkbox" checked={checklist[index]} onChange={(event) => setChecklist((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.checked : value) as [boolean, boolean, boolean])}/><span>{label}</span></label>)}</section>
        </article>}
      </section>
    </div>
  );
}

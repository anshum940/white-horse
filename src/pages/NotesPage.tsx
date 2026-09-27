import { useEffect, useMemo, useState } from 'react';
import { updateNoteDisclosure } from '../db';
import type { NoteDisclosure, WorkspaceData } from '../domain/types';
import { Icon } from '../components/Icon';
import { PageHeader, ProgressBar, StatusBadge } from '../components/ui';

export function NotesPage({ workspace, notify }: { workspace: WorkspaceData; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const sorted = useMemo(() => [...workspace.notes].sort((a, b) => Number(a.noteNumber) - Number(b.noteNumber)), [workspace.notes]);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? '');
  const selected = sorted.find((note) => note.id === selectedId) ?? sorted[0];
  const [narrative, setNarrative] = useState(selected?.narrative ?? '');
  const [status, setStatus] = useState<NoteDisclosure['status']>(selected?.status ?? 'PENDING');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNarrative(selected?.narrative ?? ''); setStatus(selected?.status ?? 'PENDING'); }, [selected?.id, selected?.narrative, selected?.status]);
  const complete = workspace.notes.filter((note) => note.status === 'COMPLETE').length;
  const percent = workspace.notes.length ? (complete / workspace.notes.length) * 100 : 0;

  async function save() {
    if (!selected) return;
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
          <div className="notes-list-header"><h2>Notes index</h2><button className="icon-button"><Icon name="search"/></button></div>
          {sorted.map((note) => <button key={note.id} className={selected?.id === note.id ? 'active' : ''} onClick={() => setSelectedId(note.id)}><span className="note-number">{note.noteNumber}</span><span><strong>{note.title}</strong><small>{note.owner}</small></span><StatusBadge tone={note.status === 'COMPLETE' ? 'green' : note.status === 'PENDING' ? 'red' : note.status === 'IN_REVIEW' ? 'amber' : 'neutral'}>{note.status.replace('_', ' ')}</StatusBadge></button>)}
        </aside>
        {selected && <article className="panel note-editor">
          <header><div><span className="eyebrow">Note {selected.noteNumber}</span><h2>{selected.title}</h2><p>Last updated {new Date(selected.updatedAt).toLocaleDateString('en-IN')} · Owner {selected.owner}</p></div><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as NoteDisclosure['status'])}><option value="PENDING">Pending</option><option value="IN_REVIEW">In review</option><option value="COMPLETE">Complete</option><option value="NOT_APPLICABLE">Not applicable</option></select></label></header>
          {selected.taxonomyCodes.length > 0 && <div className="cross-reference"><Icon name="mapping" size={16}/><span><strong>Mapped statement heads:</strong> {selected.taxonomyCodes.join(', ')}</span></div>}
          <label className="editor-label"><span>Disclosure narrative / workpaper summary</span><textarea value={narrative} onChange={(event) => setNarrative(event.target.value)} rows={12}/></label>
          <div className="editor-guidance"><Icon name="info" size={16}/><div><strong>Professional judgement required</strong><p>White Horse preserves the note structure and mapped totals. The preparer remains responsible for applicable legal and accounting-standard disclosures.</p></div></div>
          <section className="note-checklist"><h3>Review checklist</h3><label><input type="checkbox" defaultChecked/><span>Mapped total agrees to the face statement before rounding</span></label><label><input type="checkbox" defaultChecked={selected.status === 'COMPLETE'}/><span>Current and comparative disclosures are complete</span></label><label><input type="checkbox" defaultChecked={selected.status === 'COMPLETE'}/><span>Reviewer evidence and conclusion are documented</span></label></section>
        </article>}
      </section>
    </div>
  );
}

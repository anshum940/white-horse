import { useMemo, useState } from 'react';
import { createSubmittedAdjustment, reviewAdjustment } from '../db';
import { formatMoney, rupeesToPaise } from '../domain/money';
import type { Adjustment, WorkspaceData } from '../domain/types';
import { Icon } from '../components/Icon';
import { Modal, PageHeader, StatusBadge } from '../components/ui';

const adjustmentTypes: Array<{ value: Adjustment['type']; label: string }> = [
  { value: 'DEPRECIATION', label: 'Depreciation' },
  { value: 'TAX', label: 'Provision for tax' },
  { value: 'DEFERRED_TAX', label: 'Deferred tax' },
  { value: 'ACCRUAL', label: 'Accrual / outstanding expense' },
  { value: 'PREPAYMENT', label: 'Prepayment' },
  { value: 'PROVISION', label: 'Provision' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'BAD_DEBT_ECL', label: 'Bad debt / ECL' },
  { value: 'INVENTORY', label: 'Inventory adjustment' },
  { value: 'REGROUPING', label: 'Regrouping' },
  { value: 'OTHER', label: 'Other' }
];

export function AdjustmentsPage({ workspace, notify }: { workspace: WorkspaceData; notify: (message: string, tone?: 'success' | 'error') => void }) {
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState<string>();
  const [form, setForm] = useState({
    referenceNumber: `AJ-2026-${String(workspace.adjustments.length + 1).padStart(3, '0')}`,
    type: 'ACCRUAL' as Adjustment['type'],
    entryDate: workspace.period.endDate,
    narration: '',
    workpaperReference: '',
    debitLedgerId: '',
    creditLedgerId: '',
    amount: ''
  });
  const linesByAdjustment = useMemo(() => {
    const map = new Map<string, typeof workspace.adjustmentLines>();
    for (const line of workspace.adjustmentLines) map.set(line.adjustmentId, [...(map.get(line.adjustmentId) ?? []), line]);
    return map;
  }, [workspace.adjustmentLines]);
  const postedImpact = workspace.adjustments
    .filter((adjustment) => adjustment.status === 'POSTED')
    .reduce((total, adjustment) => total + (linesByAdjustment.get(adjustment.id) ?? []).reduce((sum, line) => sum + line.debitPaise, 0), 0);

  async function decide(id: string, approve: boolean) {
    setBusyId(id);
    try {
      await reviewAdjustment(id, approve);
      notify(approve ? 'Adjustment reviewed and posted.' : 'Adjustment rejected.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to review adjustment.', 'error');
    } finally {
      setBusyId(undefined);
    }
  }

  async function submit() {
    setBusyId('new');
    try {
      await createSubmittedAdjustment({
        companyId: workspace.company.id,
        periodId: workspace.period.id,
        referenceNumber: form.referenceNumber,
        type: form.type,
        entryDate: form.entryDate,
        narration: form.narration,
        workpaperReference: form.workpaperReference,
        debitLedgerId: form.debitLedgerId,
        creditLedgerId: form.creditLedgerId,
        amountPaise: rupeesToPaise(form.amount)
      });
      setShowNew(false);
      notify('Balanced adjustment submitted for reviewer approval.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to create adjustment.', 'error');
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Mapped TB → adjusted TB"
        title="Adjustments & workpapers"
        description="Every journal is balanced, referenced, prepared, reviewed and traceable to its statement impact."
        actions={<button className="button button-primary" onClick={() => setShowNew(true)}><Icon name="plus" size={16}/> New adjustment</button>}
      />
      <section className="control-strip four-columns">
        <div className="control-stat"><span>Total journals</span><strong>{workspace.adjustments.length}</strong><small>Current revision</small></div>
        <div className="control-stat control-success"><span>Posted</span><strong>{workspace.adjustments.filter((item) => item.status === 'POSTED').length}</strong><small>Included in adjusted TB</small></div>
        <div className="control-stat"><span>Awaiting review</span><strong>{workspace.adjustments.filter((item) => item.status === 'SUBMITTED').length}</strong><small>Excluded until posted</small></div>
        <div className="control-stat"><span>Posted debit impact</span><strong>{formatMoney(postedImpact, 'LAKHS')}</strong><small>₹ in lakhs</small></div>
      </section>
      <section className="adjustment-list">
        {workspace.adjustments.map((adjustment) => {
          const lines = linesByAdjustment.get(adjustment.id) ?? [];
          const debit = lines.reduce((total, line) => total + line.debitPaise, 0);
          const credit = lines.reduce((total, line) => total + line.creditPaise, 0);
          return (
            <article className="panel adjustment-card" key={adjustment.id}>
              <div className="adjustment-main">
                <div className="adjustment-ref"><span>{adjustment.referenceNumber}</span><StatusBadge tone={adjustment.status === 'POSTED' ? 'green' : adjustment.status === 'SUBMITTED' ? 'amber' : adjustment.status === 'REJECTED' ? 'red' : 'neutral'}>{adjustment.status}</StatusBadge></div>
                <h3>{adjustment.narration}</h3>
                <div className="adjustment-meta"><span>{adjustment.type.replaceAll('_', ' ')}</span><span>{adjustment.entryDate}</span><span>{adjustment.workpaperReference}</span><span>Prepared by Aarav Mehta</span></div>
              </div>
              <div className="adjustment-amount"><span>Journal total</span><strong>{formatMoney(debit, 'LAKHS')}</strong><small className={debit === credit ? 'positive' : 'negative'}>{debit === credit ? 'Debits = credits' : 'Out of balance'}</small></div>
              <div className="journal-lines">
                {lines.map((line) => {
                  const ledger = workspace.ledgers.find((item) => item.id === line.ledgerId);
                  return <div key={line.id}><span>{line.lineNumber}. {ledger?.name ?? 'Historical ledger'}</span><strong>{line.debitPaise ? `Dr ${formatMoney(line.debitPaise, 'LAKHS')}` : `Cr ${formatMoney(line.creditPaise, 'LAKHS')}`}</strong></div>;
                })}
              </div>
              {adjustment.status === 'SUBMITTED' && (
                <div className="review-actions"><button className="button button-danger-ghost" disabled={busyId === adjustment.id} onClick={() => void decide(adjustment.id, false)}>Reject</button><button className="button button-primary" disabled={busyId === adjustment.id} onClick={() => void decide(adjustment.id, true)}><Icon name="check" size={15}/> Review & post</button></div>
              )}
              {adjustment.reviewComment && <div className="review-comment"><Icon name="review" size={15}/><span><strong>Reviewer:</strong> {adjustment.reviewComment}</span></div>}
            </article>
          );
        })}
      </section>

      {showNew && (
        <Modal title="New balanced adjustment" description="The journal will be submitted for reviewer approval and will not affect statements until posted." onClose={() => setShowNew(false)} footer={<><button className="button button-secondary" onClick={() => setShowNew(false)}>Cancel</button><button className="button button-primary" disabled={busyId === 'new'} onClick={() => void submit()}>{busyId === 'new' ? 'Submitting…' : 'Submit for review'}</button></>}>
          <div className="form-grid">
            <label><span>Reference number</span><input value={form.referenceNumber} onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}/></label>
            <label><span>Adjustment type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Adjustment['type'] })}>{adjustmentTypes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label><span>Entry date</span><input type="date" value={form.entryDate} onChange={(event) => setForm({ ...form, entryDate: event.target.value })}/></label>
            <label><span>Workpaper reference</span><input value={form.workpaperReference} onChange={(event) => setForm({ ...form, workpaperReference: event.target.value })} placeholder="e.g. WP-OPEX-12"/></label>
            <label className="full-width"><span>Narration</span><textarea value={form.narration} onChange={(event) => setForm({ ...form, narration: event.target.value })} placeholder="State the basis, evidence and accounting purpose." rows={3}/></label>
            <label><span>Debit ledger</span><select value={form.debitLedgerId} onChange={(event) => setForm({ ...form, debitLedgerId: event.target.value })}><option value="">Select ledger</option>{workspace.ledgers.map((ledger) => <option value={ledger.id} key={ledger.id}>{ledger.code} · {ledger.name}</option>)}</select></label>
            <label><span>Credit ledger</span><select value={form.creditLedgerId} onChange={(event) => setForm({ ...form, creditLedgerId: event.target.value })}><option value="">Select ledger</option>{workspace.ledgers.map((ledger) => <option value={ledger.id} key={ledger.id}>{ledger.code} · {ledger.name}</option>)}</select></label>
            <label className="full-width"><span>Amount (₹)</span><input inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00"/></label>
          </div>
        </Modal>
      )}
    </div>
  );
}

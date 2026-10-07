import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ContactActions } from '../../components/crm/ContactActions';
import { formatInr, formatRelativeDay, formatShortDate } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';
import { DEAL_STAGE_LABELS } from '../../lib/crm/terminology';
import type { Activity } from '../../lib/crm/types';

export function CrmCustomerDetailPage() {
  const { customerId } = useParams();
  const { state, customerById, logCall, addNote, addFollowUp } = useCrm();
  const [note, setNote] = useState('');

  const customer = customerId ? customerById(customerId) : undefined;
  const activities = useMemo(
    () => state.activities.filter((a) => a.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.activities, customerId],
  );

  const nextFollowUp = state.followUps
    .filter((f) => f.customerId === customerId && !f.completedAt)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];

  if (!customer) {
    return <p className="text-muted">Customer not found.</p>;
  }

  const id = customer.id;

  function saveNote() {
    if (!note.trim()) return;
    addNote(id, note.trim());
    setNote('');
  }

  function quickFollowUp() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    addFollowUp({ customerId: id, dueAt: tomorrow.toISOString(), reason: 'Follow-up' });
  }

  const grouped = groupActivities(activities);

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <Link to="/app/quickcrm/customers" className="text-sm font-semibold text-brand">← Customers</Link>

      <header className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h1 className="font-display text-2xl font-bold">{customer.name}</h1>
        {customer.company ? <p className="text-muted">{customer.company}</p> : null}
        <p className="mt-2 text-sm">📞 {customer.mobile}</p>
        <div className="mt-4">
          <ContactActions mobile={customer.mobile} name={customer.name} onCall={() => logCall(customer.id)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">Status</p>
            <p className="font-semibold">{DEAL_STAGE_LABELS[customer.status]}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted">Next follow-up</p>
            <p className="font-semibold">
              {nextFollowUp ? formatShortDate(nextFollowUp.dueAt) : '—'}
            </p>
          </div>
        </div>
        <Link to={`/app/quickcrm/customers/${customer.id}/edit`} className="mt-4 inline-block text-sm font-semibold text-brand">
          Edit details
        </Link>
      </header>

      {state.quotations.filter((q) => q.customerId === customerId).length > 0 ? (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Quotes & invoices</h2>
          <ul className="mt-2 space-y-2">
            {state.quotations
              .filter((q) => q.customerId === customerId)
              .slice(0, 5)
              .map((q) => (
                <li key={q.id} className="flex flex-col gap-1 rounded-xl border border-line bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold">{q.number}</span>
                  <span className="text-muted capitalize">{q.documentType}</span>
                  <span className="font-bold">{formatInr(q.total)}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Activity</h2>
        <div className="mt-3 space-y-4">
          {Object.entries(grouped).map(([day, rows]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted">{day}</p>
              <ul className="mt-2 space-y-2">
                {rows.map((a) => (
                  <li key={a.id} className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
                    <p className="font-medium">{a.title}</p>
                    {a.amount != null ? <p className="text-muted">{formatInr(a.amount)}</p> : null}
                    {a.detail ? <p className="text-xs text-muted">{a.detail}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Quick actions</h2>
        <div className="mt-3 grid gap-2">
          <button type="button" onClick={saveNote} className="rounded-xl border border-line px-4 py-3 text-left text-sm font-semibold">
            + Add note
          </button>
          <textarea
            className="field"
            placeholder="Write a note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Link to={`/app/quickcrm/follow-ups/new?customer=${customer.id}`} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold">
            + Add follow-up
          </Link>
          <button type="button" onClick={quickFollowUp} className="rounded-xl border border-dashed border-line px-4 py-3 text-left text-sm text-muted">
            Quick: tomorrow 11 AM
          </button>
          <Link to={`/app/quickcrm/sales/new?customer=${customer.id}`} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold">
            + Add sale
          </Link>
          <Link to={`/app/quickcrm/payments/new?customer=${customer.id}`} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold">
            + Record payment
          </Link>
          <Link to={`/app/quickcrm/quotations/new?customer=${customer.id}`} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold">
            + Create quotation
          </Link>
        </div>
      </section>
    </div>
  );
}

function groupActivities(activities: Activity[]): Record<string, Activity[]> {
  const out: Record<string, Activity[]> = {};
  for (const a of activities) {
    const key = formatRelativeDay(a.createdAt);
    if (!out[key]) out[key] = [];
    out[key].push(a);
  }
  return out;
}

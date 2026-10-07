import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ContactActions } from '../../components/crm/ContactActions';
import { EmptyState } from '../../components/crm/EmptyState';
import { formatShortDate, isBeforeToday, isToday } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';
import type { Customer, FollowUp } from '../../lib/crm/types';

export function CrmFollowUpsPage() {
  const { state, customerById, completeFollowUp, logCall } = useCrm();
  const [params] = useSearchParams();

  useEffect(() => {
    const id = params.get('complete');
    if (id) completeFollowUp(id);
  }, [params, completeFollowUp]);

  const open = state.followUps.filter((f) => !f.completedAt);
  const today = open.filter((f) => isToday(f.dueAt));
  const overdue = open.filter((f) => isBeforeToday(f.dueAt) && !isToday(f.dueAt));
  const upcoming = open.filter((f) => !isToday(f.dueAt) && !isBeforeToday(f.dueAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold">Follow-ups</h1>
        <Link to="/app/quickcrm/follow-ups/new" className="btn-gradient w-full px-4 py-2.5 text-center text-sm sm:w-auto">New</Link>
      </div>

      {open.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          description="Schedule a follow-up in seconds and never miss a customer."
          action={
            <Link to="/app/quickcrm/follow-ups/new" className="btn-gradient w-full">+ Add follow-up</Link>
          }
        />
      ) : (
        <>
          <Section title="Today" items={today} customerById={customerById} onComplete={completeFollowUp} onCall={logCall} />
          <Section title="Overdue" items={overdue} customerById={customerById} onComplete={completeFollowUp} onCall={logCall} tone="danger" />
          <Section title="Upcoming" items={upcoming} customerById={customerById} onComplete={completeFollowUp} onCall={logCall} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  customerById,
  onComplete,
  onCall,
  tone,
}: {
  title: string;
  items: FollowUp[];
  customerById: (id: string) => Customer | undefined;
  onComplete: (id: string) => void;
  onCall: (id: string) => void;
  tone?: 'danger';
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      <ul className="mt-3 space-y-3">
        {items.map((fu) => {
          const customer = customerById(fu.customerId);
          if (!customer) return null;
          return (
            <li
              key={fu.id}
              className={`rounded-2xl border bg-white p-4 ${tone === 'danger' ? 'border-red-200' : 'border-line'}`}
            >
              <p className="font-semibold">{customer.name}</p>
              <p className="text-sm text-muted">{fu.reason}</p>
              <p className="mt-1 text-xs text-muted">{formatShortDate(fu.dueAt)}</p>
              <div className="mt-3">
                <ContactActions mobile={customer.mobile} onCall={() => onCall(customer.id)} compact />
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onComplete(fu.id)}
                  className="flex-1 rounded-xl bg-brand/10 py-2.5 text-sm font-semibold text-brand-dark"
                >
                  Complete
                </button>
                <Link
                  to={`/app/quickcrm/follow-ups/new?customer=${customer.id}&reschedule=${fu.id}`}
                  className="flex-1 rounded-xl border border-line py-2.5 text-center text-sm font-semibold"
                >
                  Reschedule
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

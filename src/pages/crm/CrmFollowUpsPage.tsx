import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/crm/EmptyState';
import { formatShortDate, isBeforeToday, isToday } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';
import type { FollowUp } from '../../lib/crm/types';

const ROW =
  'gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1.2fr)_5.5rem_auto] sm:items-center';

function bucket(fu: FollowUp): 'today' | 'overdue' | 'upcoming' {
  if (isToday(fu.dueAt)) return 'today';
  if (isBeforeToday(fu.dueAt)) return 'overdue';
  return 'upcoming';
}

const BUCKET_LABEL = { today: 'Today', overdue: 'Overdue', upcoming: 'Upcoming' } as const;
const BUCKET_CLASS = {
  today: 'bg-sky-100 text-sky-900',
  overdue: 'bg-red-50 text-red-800',
  upcoming: 'bg-slate-100 text-slate-700',
} as const;

export function CrmFollowUpsPage() {
  const { state, customerById, completeFollowUp, logCall } = useCrm();
  const [params] = useSearchParams();

  useEffect(() => {
    const id = params.get('complete');
    if (id) completeFollowUp(id);
  }, [params, completeFollowUp]);

  const open = useMemo(
    () =>
      state.followUps
        .filter((f) => !f.completedAt)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [state.followUps],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/app/quickcrm/follow-ups/new" className="btn-gradient px-4 py-2.5 text-center text-sm sm:w-auto">
          New follow-up
        </Link>
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
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="hidden gap-3 border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1.2fr)_5.5rem_auto]">
            <span>When</span>
            <span>Customer</span>
            <span>Reason</span>
            <span>Due</span>
            <span className="text-right">Actions</span>
          </div>
          <ul>
            {open.map((fu) => {
              const customer = customerById(fu.customerId);
              if (!customer) return null;
              const b = bucket(fu);
              return (
                <li key={fu.id} className={ROW}>
                  <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${BUCKET_CLASS[b]}`}>
                    {BUCKET_LABEL[b]}
                  </span>
                  <Link
                    to={`/app/quickcrm/customers/${customer.id}`}
                    className="font-semibold text-ink hover:text-brand"
                  >
                    {customer.name}
                  </Link>
                  <p className="text-muted">{fu.reason}</p>
                  <p className="text-xs text-muted">{formatShortDate(fu.dueAt)}</p>
                  <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => logCall(customer.id)}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      Call
                    </button>
                    <button
                      type="button"
                      onClick={() => completeFollowUp(fu.id)}
                      className="rounded-xl bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-dark"
                    >
                      Done
                    </button>
                    <Link
                      to={`/app/quickcrm/follow-ups/new?customer=${customer.id}&reschedule=${fu.id}`}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      Reschedule
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

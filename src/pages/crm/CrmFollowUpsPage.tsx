import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CrmAvatar } from '../../components/crm/CrmAvatar';
import { EmptyState } from '../../components/crm/EmptyState';
import { Button } from '../../components/ui/Button';
import { StatTile } from '../../components/ui/StatTile';
import { formatFollowUpGroupHeading, isBeforeToday, isToday } from '../../lib/crm/format';
import { whatsAppHref, telHref } from '../../lib/crm/whatsapp';
import { useCrm } from '../../lib/crm/context';
import type { FollowUp } from '../../lib/crm/types';

function bucket(fu: FollowUp): 'today' | 'overdue' | 'upcoming' {
  if (fu.completedAt) return 'upcoming';
  if (isToday(fu.dueAt)) return 'today';
  if (isBeforeToday(fu.dueAt)) return 'overdue';
  return 'upcoming';
}

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

  const doneCount = state.followUps.filter((f) => f.completedAt).length;
  const overdue = open.filter((f) => bucket(f) === 'overdue').length;
  const today = open.filter((f) => bucket(f) === 'today').length;
  const upcoming = open.filter((f) => !isToday(f.dueAt) && !isBeforeToday(f.dueAt)).length;

  const groups = useMemo(() => {
    const map = new Map<string, FollowUp[]>();
    for (const fu of open) {
      const key = formatFollowUpGroupHeading(fu.dueAt);
      const list = map.get(key) ?? [];
      list.push(fu);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [open]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Overdue" value={overdue} accentClassName={overdue > 0 ? 'text-red-700' : undefined} />
        <StatTile label="Today" value={today} />
        <StatTile label="Upcoming" value={upcoming} accentClassName={upcoming > 0 ? 'text-brand' : undefined} />
        <StatTile label="Done" value={doneCount} accentClassName={doneCount > 0 ? 'text-green-700' : undefined} />
      </div>

      {open.length === 0 ? (
        <EmptyState
          title="No follow-ups scheduled"
          description="Add a follow-up from a customer profile or after sending a quotation."
          action={
            <Link to="/app/quickcrm/customers" className="btn-gradient w-full">Open customers</Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([heading, items]) => (
            <section key={heading}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{heading}</h2>
              <ul className="mt-3 space-y-3">
                {items.map((fu) => {
                  const customer = customerById(fu.customerId);
                  if (!customer) return null;
                  return (
                    <li
                      key={fu.id}
                      className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 gap-3">
                        <CrmAvatar name={customer.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">
                            {customer.name}
                            {customer.company ? (
                              <span className="font-normal text-muted"> · {customer.company}</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">{fu.reason}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={telHref(customer.mobile)}
                          onClick={() => logCall(customer.id)}
                          className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-line-soft"
                        >
                          Call
                        </a>
                        <a
                          href={whatsAppHref(customer.mobile, `Hi ${customer.name}, ${fu.reason}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-line-soft"
                        >
                          WhatsApp
                        </a>
                        <Link
                          to={`/app/quickcrm/follow-ups/new?customer=${customer.id}&reschedule=${fu.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-line-soft"
                        >
                          Reschedule
                        </Link>
                        <Button type="button" variant="dark" size="sm" onClick={() => completeFollowUp(fu.id)}>
                          Mark done
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

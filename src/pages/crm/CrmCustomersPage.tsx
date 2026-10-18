import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/crm/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { formatShortDate } from '../../lib/crm/format';
import { DEAL_STAGE_LABELS } from '../../lib/crm/terminology';
import { useCrm } from '../../lib/crm/context';
import type { DealStage } from '../../lib/crm/types';

type StageFilter = 'all' | DealStage;

const ROW =
  'gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_7rem_6.5rem_6rem] sm:items-center';

export function CrmCustomersPage() {
  const { state, logCall } = useCrm();
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<StageFilter>('all');

  const nextByCustomer = useMemo(() => {
    const map = new Map<string, (typeof state.followUps)[0]>();
    for (const fu of state.followUps) {
      if (fu.completedAt) continue;
      const prev = map.get(fu.customerId);
      if (!prev || new Date(fu.dueAt) < new Date(prev.dueAt)) map.set(fu.customerId, fu);
    }
    return map;
  }, [state.followUps]);

  const stageCounts = useMemo(() => {
    const counts: Record<DealStage, number> = {
      new: 0,
      interested: 0,
      quotation: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    };
    for (const c of state.customers) counts[c.status] += 1;
    return counts;
  }, [state.customers]);

  const filtered = state.customers.filter((c) => {
    if (stage !== 'all' && c.status !== stage) return false;
    const blob = [c.name, c.company, c.mobile].join(' ').toLowerCase();
    return blob.includes(q.trim().toLowerCase());
  });

  const stageOptions: { id: StageFilter; label: string }[] = [
    { id: 'all', label: `All · ${state.customers.length}` },
    ...(['new', 'interested', 'quotation', 'negotiation', 'won', 'lost'] as DealStage[]).map((id) => ({
      id,
      label: `${DEAL_STAGE_LABELS[id]} · ${stageCounts[id]}`,
    })),
  ];

  return (
    <div className="space-y-4">
      <input
        className="field w-full"
        placeholder="Search name, company, phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Segmented aria-label="Customer stage" value={stage} onChange={setStage} options={stageOptions} />

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers in this view"
          description="Add your first customer or change the stage filter."
          action={
            <Link to="/app/quickcrm/customers/new" className="btn-gradient w-full">
              + Add Customer
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="hidden gap-3 border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_7rem_6.5rem_6rem]">
            <span>Name</span>
            <span>Company</span>
            <span>Phone</span>
            <span>Stage</span>
            <span>Next follow-up</span>
          </div>
          <ul>
            {filtered.map((customer) => {
              const next = nextByCustomer.get(customer.id);
              return (
                <li key={customer.id} className={ROW}>
                  <Link to={`/app/quickcrm/customers/${customer.id}`} className="font-semibold text-ink hover:text-brand">
                    {customer.name}
                  </Link>
                  <p className="truncate text-muted">{customer.company || '—'}</p>
                  <button
                    type="button"
                    onClick={() => logCall(customer.id)}
                    className="text-left font-semibold text-brand hover:underline"
                  >
                    {customer.mobile}
                  </button>
                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                    {DEAL_STAGE_LABELS[customer.status]}
                  </span>
                  <p className="text-xs text-muted">{next ? formatShortDate(next.dueAt) : '—'}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { ChevronRight, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CrmAvatar } from '../../components/crm/CrmAvatar';
import { EmptyState } from '../../components/crm/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { formatIndianPhone } from '../../lib/format-phone';
import { formatShortDate } from '../../lib/crm/format';
import { DEAL_STAGE_LABELS } from '../../lib/crm/terminology';
import { telHref, whatsAppHref } from '../../lib/crm/whatsapp';
import { useCrm } from '../../lib/crm/context';
import type { DealStage } from '../../lib/crm/types';

type StageFilter = 'all' | DealStage;

const ROW =
  'gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_6.5rem_6rem_auto] sm:items-center';

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
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <div className="hidden min-w-[720px] gap-3 border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_6.5rem_6rem_auto]">
            <span>Customer</span>
            <span>Company</span>
            <span>Phone</span>
            <span>Stage</span>
            <span>Next follow-up</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="min-w-[720px]">
            {filtered.map((customer) => {
              const next = nextByCustomer.get(customer.id);
              return (
                <li key={customer.id} className={ROW}>
                  <div className="flex min-w-0 items-center gap-2">
                    <CrmAvatar name={customer.name} className="!h-8 !w-8 text-xs" />
                    <Link
                      to={`/app/quickcrm/customers/${customer.id}`}
                      className="truncate font-semibold text-ink hover:text-brand"
                    >
                      {customer.name}
                    </Link>
                  </div>
                  <p className="truncate text-muted">{customer.company || '—'}</p>
                  <p className="text-sm tabular-nums text-muted">{formatIndianPhone(customer.mobile)}</p>
                  <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
                    {DEAL_STAGE_LABELS[customer.status]}
                  </span>
                  <p className="text-xs text-muted">{next ? formatShortDate(next.dueAt) : '—'}</p>
                  <div className="flex justify-start gap-1 sm:justify-end">
                    <a
                      href={telHref(customer.mobile)}
                      onClick={() => logCall(customer.id)}
                      aria-label={`Call ${customer.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-line-soft"
                    >
                      <Phone className="h-[18px] w-[18px] stroke-[1.8] text-brand" aria-hidden />
                    </a>
                    <a
                      href={whatsAppHref(customer.mobile, `Hi ${customer.name}`)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp ${customer.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-line-soft"
                    >
                      <MessageCircle className="h-[18px] w-[18px] stroke-[1.8] text-green-700" aria-hidden />
                    </a>
                    <Link
                      to={`/app/quickcrm/customers/${customer.id}`}
                      aria-label={`Open ${customer.name}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-line-soft"
                    >
                      <ChevronRight className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
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

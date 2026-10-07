import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEAL_STAGE_LABELS } from '../../lib/crm/terminology';
import { formatRelativeDay } from '../../lib/crm/format';
import type { Customer, FollowUp } from '../../lib/crm/types';
import { ContactActions } from './ContactActions';

type Props = {
  customer: Customer;
  nextFollowUp?: FollowUp | null;
  onCall?: () => void;
};

export function CustomerCard({ customer, nextFollowUp, onCall }: Props) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-sm shadow-slate-200/30">
      <Link to={`/app/quickcrm/customers/${customer.id}`} className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{customer.name}</h3>
          {customer.company ? <p className="truncate text-sm text-muted">{customer.company}</p> : null}
          <p className="mt-1 text-sm text-muted">{customer.mobile}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-brand/10 px-2.5 py-1 font-medium text-brand-dark">
          {DEAL_STAGE_LABELS[customer.status]}
        </span>
        {nextFollowUp && !nextFollowUp.completedAt ? (
          <span className="text-muted">Follow-up {formatRelativeDay(nextFollowUp.dueAt)}</span>
        ) : null}
      </div>
      <div className="mt-3">
        <ContactActions mobile={customer.mobile} name={customer.name} onCall={onCall} compact />
      </div>
    </article>
  );
}

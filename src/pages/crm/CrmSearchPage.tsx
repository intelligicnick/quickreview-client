import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { crmPath } from '../../lib/crm/paths';
import { formatInr, formatRelativeDay } from '../../lib/crm/format';
import { searchCrm } from '../../lib/crm/search';
import { useCrm } from '../../lib/crm/context';

export function CrmSearchPage() {
  const { state } = useCrm();
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchCrm(state, q), [state, q]);

  return (
    <div className="space-y-4">
      <Link to={crmPath()} className="inline-flex min-h-10 items-center text-sm font-semibold text-brand">
        ← Back
      </Link>
      <h1 className="font-display text-2xl font-bold">Search</h1>
      <input
        autoFocus
        className="field w-full"
        placeholder="Name, phone, company, sale…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="space-y-2">
        {hits.map((hit, i) => {
          if (hit.type === 'customer') {
            const fu = state.followUps.find((f) => f.customerId === hit.customer.id && !f.completedAt);
            return (
              <li key={`c-${hit.customer.id}-${i}`}>
                <Link to={`/app/quickcrm/customers/${hit.customer.id}`} className="block rounded-xl border border-line bg-white p-4">
                  <p className="font-semibold">{hit.customer.name}</p>
                  <p className="text-sm text-muted">{hit.subtitle}</p>
                  {fu ? <p className="mt-1 text-xs text-brand">Follow-up {formatRelativeDay(fu.dueAt)}</p> : null}
                </Link>
              </li>
            );
          }
          if (hit.type === 'quotation') {
            return (
              <li key={`q-${hit.quotationId}`}>
                <Link to={`/app/quickcrm/customers/${hit.customer.id}`} className="block rounded-xl border border-line bg-white p-4">
                  <p className="font-semibold">{hit.customer.name}</p>
                  <p className="text-sm text-muted">{formatInr(hit.amount)} quotation</p>
                </Link>
              </li>
            );
          }
          return (
            <li key={`s-${hit.saleId}`}>
              <Link to="/app/quickcrm/sales" className="block rounded-xl border border-line bg-white p-4">
                <p className="font-semibold">{hit.customer.name}</p>
                <p className="text-sm text-muted">{hit.title} · {formatInr(hit.amount)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

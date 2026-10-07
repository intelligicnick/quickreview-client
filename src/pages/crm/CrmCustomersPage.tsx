import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerCard } from '../../components/crm/CustomerCard';
import { EmptyState } from '../../components/crm/EmptyState';
import { useCrm } from '../../lib/crm/context';

export function CrmCustomersPage() {
  const { state, logCall } = useCrm();
  const [q, setQ] = useState('');

  const nextByCustomer = useMemo(() => {
    const map = new Map<string, (typeof state.followUps)[0]>();
    for (const fu of state.followUps) {
      if (fu.completedAt) continue;
      const prev = map.get(fu.customerId);
      if (!prev || new Date(fu.dueAt) < new Date(prev.dueAt)) map.set(fu.customerId, fu);
    }
    return map;
  }, [state.followUps]);

  const filtered = state.customers.filter((c) => {
    const blob = [c.name, c.company, c.mobile].join(' ').toLowerCase();
    return blob.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted">{state.customers.length} total</p>
        </div>
        <Link to="/app/quickcrm/customers/new" className="btn-gradient shrink-0 px-4 py-2.5 text-sm lg:hidden">
          Add
        </Link>
      </div>

      <input
        className="field w-full"
        placeholder="Search name, company, phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer and start managing your business."
          action={
            <Link to="/app/quickcrm/customers/new" className="btn-gradient w-full">
              + Add Customer
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((customer) => (
            <li key={customer.id}>
              <CustomerCard
                customer={customer}
                nextFollowUp={nextByCustomer.get(customer.id)}
                onCall={() => logCall(customer.id)}
              />
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

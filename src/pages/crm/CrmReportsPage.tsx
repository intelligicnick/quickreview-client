import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatPill } from '../../components/crm/StatPill';
import { formatInr, pendingAmount, startOfDay } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';

type Range = 'today' | 'week' | 'month' | 'all';

export function CrmReportsPage() {
  const { state } = useCrm();
  const [range, setRange] = useState<Range>('month');

  const since = useMemo(() => {
    const d = startOfDay(new Date());
    if (range === 'today') return d;
    if (range === 'week') {
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (range === 'month') {
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    return new Date(0);
  }, [range]);

  const inRange = (iso: string) => new Date(iso) >= since;

  const revenue = state.payments.filter((p) => inRange(p.paidAt)).reduce((s, p) => s + p.amount, 0);
  const newCustomers = state.customers.filter((c) => inRange(c.createdAt)).length;
  const pending = state.sales.reduce((s, sale) => s + pendingAmount(sale), 0);
  const followUpsDone = state.followUps.filter((f) => f.completedAt && inRange(f.completedAt)).length;

  return (
    <div className="space-y-6">
      <Link to="/app/quickcrm/more" className="text-sm font-semibold text-brand">← More</Link>
      <h1 className="font-display text-2xl font-bold">Reports</h1>
      <div className="flex flex-wrap gap-2">
        {(['today', 'week', 'month', 'all'] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              range === r ? 'bg-brand text-white' : 'border border-line bg-white text-muted'
            }`}
          >
            {r === 'all' ? 'All time' : r === 'week' ? 'This week' : r === 'month' ? 'This month' : 'Today'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Revenue" value={formatInr(revenue)} />
        <StatPill label="New customers" value={newCustomers} />
        <StatPill label="Pending payments" value={formatInr(pending)} />
        <StatPill label="Follow-ups done" value={followUpsDone} />
      </div>
    </div>
  );
}

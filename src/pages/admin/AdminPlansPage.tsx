import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { api, ApiError } from '../../lib/api';
import { productDisplayName } from '../../lib/admin-products';
import { formatINR, pluralize } from '../../lib/admin-ui';

type Plan = {
  id: string;
  code: string;
  name: string;
  product: string;
  amountInr: number;
  durationDays: number;
  isActive: boolean;
  activeLocationCount: number;
};

export function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const planGrid = useMemo(() => {
    const byProduct = new Map<string, { trial?: Plan; monthly?: Plan }>();
    for (const plan of plans) {
      const bucket = byProduct.get(plan.product) ?? {};
      if (plan.amountInr === 0) bucket.trial = plan;
      else bucket.monthly = plan;
      byProduct.set(plan.product, bucket);
    }
    return [...byProduct.entries()].map(([product, row]) => ({
      product,
      label: productDisplayName(product),
      trial: row.trial,
      monthly: row.monthly,
    }));
  }, [plans]);

  async function load() {
    setPlans(await api<Plan[]>('/api/admin/plans'));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load plans'));
  }, []);

  async function togglePlan(plan: Plan) {
    if (plan.isActive && !window.confirm(`Stop offering ${plan.name} to new merchants?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/plans/${plan.id}`, { method: 'PATCH', body: { isActive: !plan.isActive } });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update plan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Plans & prices" subtitle="One row per product. Toggle availability for new purchases." />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      <section className="admin-card admin-table-scroll p-5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Free trial</th>
              <th className="py-2 pr-3">Monthly</th>
              <th className="py-2 pr-3">Sold to merchants</th>
              <th className="py-2">Live</th>
            </tr>
          </thead>
          <tbody>
            {planGrid.map((row) => (
              <tr key={row.product} className="border-b border-[var(--admin-border-soft)] last:border-0">
                <td className="py-3 pr-3 font-semibold">{row.label}</td>
                <td className="py-3 pr-3 text-[var(--admin-muted)]">
                  {row.trial ? `${row.trial.durationDays} days` : '—'}
                </td>
                <td className="py-3 pr-3">
                  {row.monthly ? `${formatINR(row.monthly.amountInr)} / ${row.monthly.durationDays} d` : '—'}
                </td>
                <td className="py-3 pr-3">
                  {pluralize(
                    row.monthly?.activeLocationCount ?? row.trial?.activeLocationCount ?? 0,
                    'location',
                  )}
                </td>
                <td className="py-3">
                  {row.monthly ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void togglePlan(row.monthly!)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        row.monthly.isActive
                          ? 'admin-pill-success'
                          : 'bg-[var(--admin-border-soft)] text-[var(--admin-muted)]'
                      }`}
                    >
                      {row.monthly.isActive ? 'On sale' : 'Off'}
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

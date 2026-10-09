import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocationPicker } from '../../components/admin/LocationPicker';
import { api, ApiError } from '../../lib/api';
import { adminWhen, inr } from '../../lib/admin-ui';

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

type Payment = {
  id: string;
  status: string;
  provider: string | null;
  amountInr: number;
  referenceNote: string | null;
  locationId: string | null;
  locationName: string | null;
  userEmail: string | null;
  planName: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
};

const PRODUCT_LABEL: Record<string, string> = {
  QUICK_REVIEW: 'QuickReview',
  QUICK_MENU: 'QuickCommerce',
  QUICK_CRM: 'QuickCRM',
  QUICK_CONNECT: 'QuickConnect',
  QUICK_DESIGN: 'QuickDesign',
  QUICK_SCAN: 'QuickScan',
};

export function AdminSubscriptionsPage() {
  const [params] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(params.get('payment'));
  const [comp, setComp] = useState({ locationId: '', planId: '', reason: '', durationDays: '30' });
  const [manual, setManual] = useState({ locationId: '', planId: '', provider: 'UPI' as 'UPI' | 'CASH' });

  const selected = payments.find((row) => row.id === selectedId) ?? payments.find((row) => row.status === 'PENDING');

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
      label: PRODUCT_LABEL[product] ?? product,
      trial: row.trial,
      monthly: row.monthly,
    }));
  }, [plans]);

  async function load() {
    const [planRows, payRows] = await Promise.all([
      api<Plan[]>('/api/admin/plans'),
      api<Payment[]>('/api/admin/payments'),
    ]);
    setPlans(planRows);
    setPayments(payRows);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load billing'));
  }, []);

  useEffect(() => {
    const id = params.get('payment');
    if (id) setSelectedId(id);
  }, [params]);

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

  async function approve(paymentId: string, note?: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/payments/${paymentId}/mark-paid`, { method: 'POST', body: { note } });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not confirm payment');
    } finally {
      setBusy(false);
    }
  }

  async function reject(paymentId: string) {
    const reason = window.prompt('Reason for rejection (merchant will need to resubmit):');
    if (!reason || reason.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/payments/${paymentId}/reject`, { method: 'POST', body: { reason: reason.trim() } });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject payment');
    } finally {
      setBusy(false);
    }
  }

  async function onComp(event: FormEvent) {
    event.preventDefault();
    if (!comp.locationId || !comp.planId || comp.reason.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/admin/subscriptions/comp', {
        method: 'POST',
        body: {
          locationId: comp.locationId,
          planId: comp.planId,
          reason: comp.reason.trim(),
          durationDays: Number(comp.durationDays) || undefined,
        },
      });
      setComp({ locationId: '', planId: '', reason: '', durationDays: '30' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not grant comp');
    } finally {
      setBusy(false);
    }
  }

  async function onManual(event: FormEvent) {
    event.preventDefault();
    if (!manual.locationId || !manual.planId) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/admin/payments/manual', { method: 'POST', body: manual });
      setManual({ locationId: '', planId: '', provider: 'UPI' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create payment');
    } finally {
      setBusy(false);
    }
  }

  const waiting = payments.filter((row) => row.status === 'PENDING');

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Payments</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Razorpay activates on its own. UPI and cash wait here until you verify money arrived.
      </p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">To verify ({waiting.length} waiting)</h2>
          {waiting.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No UPI or cash payments waiting.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {waiting.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left ${
                      selected?.id === row.id ? 'border-brand bg-brand/5' : 'border-line hover:border-brand/30'
                    }`}
                  >
                    <p className="font-semibold">{inr(row.amountInr)} · {row.provider ?? '—'} · Waiting</p>
                    <p className="text-sm text-muted">{row.planName ?? '—'} · {row.locationName ?? '—'}</p>
                    <p className="text-xs text-muted">{adminWhen(row.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          {selected && selected.status === 'PENDING' ? (
            <>
              <h2 className="font-bold">UPI payment</h2>
              <p className="mt-1 text-3xl font-extrabold">{inr(selected.amountInr)}</p>
              <dl className="mt-4 grid gap-2 text-sm">
                <Row label="Merchant" value={selected.userEmail ?? '—'} />
                <Row label="Location" value={selected.locationName ?? '—'} />
                <Row label="Plan" value={selected.planName ?? '—'} />
                <Row label="UTR / UPI ref" value={selected.referenceNote ?? '—'} />
                <Row label="Submitted" value={adminWhen(selected.createdAt)} />
              </dl>
              <p className="mt-4 text-sm text-muted">
                Before approving: match UTR in your bank app, confirm amount, then activate the plan through{' '}
                {selected.subscriptionEndDate ?? 'the billing period'}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void approve(selected.id)}
                  className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Approve &amp; activate
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void reject(selected.id)}
                  className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold disabled:opacity-50"
                >
                  Reject…
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Select a waiting payment to verify.</p>
          )}
        </section>
      </div>

      <section id="plans" className="mt-8 scroll-mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Plans &amp; prices</h2>
        <p className="mt-1 text-sm text-muted">One row per product. Toggle availability for new purchases.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Free trial</th>
                <th className="py-2 pr-3">Monthly</th>
                <th className="py-2 pr-3">Sold to merchants</th>
                <th className="py-2">Live</th>
              </tr>
            </thead>
            <tbody>
              {planGrid.map((row) => (
                <tr key={row.product} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 font-semibold">{row.label}</td>
                  <td className="py-3 pr-3 text-muted">
                    {row.trial ? `${row.trial.durationDays} days` : '—'}
                  </td>
                  <td className="py-3 pr-3">
                    {row.monthly ? `${inr(row.monthly.amountInr)} / ${row.monthly.durationDays} d` : '—'}
                  </td>
                  <td className="py-3 pr-3">{row.monthly?.activeLocationCount ?? row.trial?.activeLocationCount ?? 0} locations</td>
                  <td className="py-3">
                    {row.monthly ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void togglePlan(row.monthly!)}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          row.monthly.isActive ? 'bg-green-100 text-green-800' : 'bg-paper text-muted ring-1 ring-line'
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
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form onSubmit={onComp} className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">Grant free access</h2>
          <p className="mt-1 text-sm text-muted">Requires a reason and duration. Logged in activity.</p>
          <div className="mt-4">
            <LocationPicker value={comp.locationId} onChange={(id) => setComp((v) => ({ ...v, locationId: id }))} />
          </div>
          <select
            value={comp.planId}
            onChange={(e) => setComp((v) => ({ ...v, planId: e.target.value }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          >
            <option value="">Choose plan</option>
            {plans.filter((p) => p.amountInr > 0).map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
          <input
            value={comp.durationDays}
            onChange={(e) => setComp((v) => ({ ...v, durationDays: e.target.value }))}
            type="number"
            min={1}
            className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
            placeholder="Duration (days)"
          />
          <textarea
            value={comp.reason}
            onChange={(e) => setComp((v) => ({ ...v, reason: e.target.value }))}
            rows={2}
            className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
            placeholder="Reason (required)"
          />
          <button type="submit" disabled={busy} className="mt-3 min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50">
            Grant access
          </button>
        </form>
        <form onSubmit={onManual} className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">Record UPI / cash checkout</h2>
          <div className="mt-4">
            <LocationPicker value={manual.locationId} onChange={(id) => setManual((v) => ({ ...v, locationId: id }))} />
          </div>
          <select
            value={manual.planId}
            onChange={(e) => setManual((v) => ({ ...v, planId: e.target.value }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          >
            <option value="">Choose plan</option>
            {plans.filter((p) => p.amountInr > 0).map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name} ({inr(plan.amountInr)})</option>
            ))}
          </select>
          <select
            value={manual.provider}
            onChange={(e) => setManual((v) => ({ ...v, provider: e.target.value as 'UPI' | 'CASH' }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          >
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
          </select>
          <button type="submit" disabled={busy} className="mt-3 min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50">
            Create pending payment
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/60 pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

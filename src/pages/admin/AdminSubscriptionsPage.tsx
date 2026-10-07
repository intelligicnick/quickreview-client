import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';

type Plan = {
  id: string;
  code: string;
  name: string;
  product: string;
  amountInr: number;
  durationDays: number;
  isActive: boolean;
};

type Subscription = {
  id: string;
  status: string;
  source: string;
  amountInr: number;
  startDate: string;
  endDate: string;
  location: { id: string; name: string };
  plan: { id: string; name: string };
  user: { email: string };
};

type Payment = {
  id: string;
  status: string;
  provider: string | null;
  amountInr: number;
  locationName: string | null;
  userEmail: string | null;
  createdAt: string;
};

export function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [comp, setComp] = useState({ locationId: '', planId: '' });
  const [manual, setManual] = useState({ locationId: '', planId: '', provider: 'UPI' as 'UPI' | 'CASH' });

  async function load() {
    const [planRows, subRows, payRows] = await Promise.all([
      api<Plan[]>('/api/admin/plans'),
      api<Subscription[]>('/api/admin/subscriptions'),
      api<Payment[]>('/api/admin/payments?status=PENDING'),
    ]);
    setPlans(planRows);
    setSubscriptions(subRows);
    setPayments(payRows);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load billing'));
  }, []);

  async function togglePlan(plan: Plan) {
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

  async function markPaid(paymentId: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/payments/${paymentId}/mark-paid`, { method: 'POST', body: {} });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not confirm payment');
    } finally {
      setBusy(false);
    }
  }

  async function onComp(event: FormEvent) {
    event.preventDefault();
    if (!comp.locationId || !comp.planId) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/admin/subscriptions/comp', { method: 'POST', body: comp });
      setComp({ locationId: '', planId: '' });
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

  async function showInvoice(subscriptionId: string) {
    try {
      const invoice = await api<Record<string, unknown>>(`/api/admin/subscriptions/${subscriptionId}/invoice`);
      window.alert(JSON.stringify(invoice, null, 2));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load invoice');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted">Plans, UPI/cash activation, comps, and invoices.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Plans</h2>
        <ul className="mt-4 space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-muted">
                  {plan.product} · ₹{plan.amountInr} · {plan.durationDays} days
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void togglePlan(plan)}
                className="min-h-10 rounded-xl border border-line px-3 text-sm font-semibold disabled:opacity-50"
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Pending payments</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing waiting on UPI or cash.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {payments.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">₹{row.amountInr} · {row.provider ?? '—'}</p>
                  <p className="text-sm text-muted">{row.locationName ?? '—'} · {row.userEmail ?? '—'}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void markPaid(row.id)}
                  className="min-h-10 rounded-xl bg-brand px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Mark paid
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form onSubmit={onComp} className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">Comp subscription</h2>
          <p className="mt-1 text-sm text-muted">Grant active access without payment.</p>
          <input
            value={comp.locationId}
            onChange={(e) => setComp((v) => ({ ...v, locationId: e.target.value }))}
            placeholder="Location ID"
            className="mt-4 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          />
          <select
            value={comp.planId}
            onChange={(e) => setComp((v) => ({ ...v, planId: e.target.value }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          >
            <option value="">Choose plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="mt-3 min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50">
            Grant comp
          </button>
        </form>
        <form onSubmit={onManual} className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">UPI / cash checkout</h2>
          <p className="mt-1 text-sm text-muted">Creates pending payment — confirm when money arrives.</p>
          <input
            value={manual.locationId}
            onChange={(e) => setManual((v) => ({ ...v, locationId: e.target.value }))}
            placeholder="Location ID"
            className="mt-4 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          />
          <select
            value={manual.planId}
            onChange={(e) => setManual((v) => ({ ...v, planId: e.target.value }))}
            className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm"
          >
            <option value="">Choose plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name} (₹{plan.amountInr})</option>
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
            Create pending
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Recent subscriptions</h2>
        <ul className="mt-4 space-y-3">
          {subscriptions.map((row) => (
            <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3 last:border-0">
              <div>
                <p className="font-semibold">{row.location.name}</p>
                <p className="text-sm text-muted">
                  {row.plan.name} · {row.status} · {row.source} · until {row.endDate}
                </p>
                <p className="text-xs text-muted">{row.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void showInvoice(row.id)}
                className="text-sm font-semibold text-brand"
              >
                Invoice
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

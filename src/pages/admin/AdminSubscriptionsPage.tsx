import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LocationPicker } from '../../components/admin/LocationPicker';
import { PageHeader } from '../../components/admin/PageHeader';
import { Modal } from '../../components/admin/ui/Modal';
import { api, ApiError } from '../../lib/api';
import { productDisplayName } from '../../lib/admin-products';
import {
  formatDateTime,
  formatINR,
  isValidUtr,
  relativeAge,
  utrDigitsOnly,
} from '../../lib/admin-ui';

type Plan = {
  id: string;
  code: string;
  name: string;
  product: string;
  amountInr: number;
  durationDays: number;
  isActive: boolean;
};

type Payment = {
  id: string;
  kind: string;
  status: string;
  provider: string | null;
  amountInr: number;
  referenceNote: string | null;
  locationId: string | null;
  locationName: string | null;
  userEmail: string | null;
  userId: string | null;
  planName: string | null;
  planId: string | null;
  orderId: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
};

type Tab = 'pending' | 'approved' | 'rejected' | 'razorpay' | 'all';

export function AdminSubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(params.get('payment'));
  const [utrInput, setUtrInput] = useState('');
  const [grantOpen, setGrantOpen] = useState(params.get('action') === 'grant');
  const [manualOpen, setManualOpen] = useState(params.get('action') === 'manual');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [comp, setComp] = useState({ locationId: '', planId: '', reason: '', durationDays: '30' });
  const [manual, setManual] = useState({ locationId: '', planId: '', provider: 'UPI' as 'UPI' | 'CASH' });

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
    setGrantOpen(params.get('action') === 'grant');
    setManualOpen(params.get('action') === 'manual');
  }, [params]);

  const filteredList = useMemo(() => {
    const sorted = [...payments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    if (tab === 'pending') return sorted.filter((r) => r.status === 'PENDING');
    if (tab === 'approved') return sorted.filter((r) => r.status === 'SUCCEEDED');
    if (tab === 'rejected') return sorted.filter((r) => r.status === 'FAILED');
    if (tab === 'razorpay') return sorted.filter((r) => r.provider === 'RAZORPAY');
    return sorted;
  }, [payments, tab]);

  const selected = payments.find((row) => row.id === selectedId) ?? filteredList[0];

  useEffect(() => {
    if (!selected) return;
    const digits = (selected.referenceNote ?? '').replace(/\D/g, '');
    setUtrInput(digits.length === 12 ? digits : '');
  }, [selected?.id, selected?.referenceNote]);

  const effectiveUtr =
    utrInput.trim().length === 12
      ? utrInput.trim()
      : (selected?.referenceNote ?? '').replace(/\D/g, '').length === 12
        ? (selected?.referenceNote ?? '').replace(/\D/g, '')
        : '';
  const canApprove =
    selected?.status === 'PENDING' &&
    (selected.provider !== 'UPI' || isValidUtr(effectiveUtr));

  const tabCounts = useMemo(
    () => ({
      pending: payments.filter((r) => r.status === 'PENDING').length,
      approved: payments.filter((r) => r.status === 'SUCCEEDED').length,
      rejected: payments.filter((r) => r.status === 'FAILED').length,
      razorpay: payments.filter((r) => r.provider === 'RAZORPAY').length,
      all: payments.length,
    }),
    [payments],
  );

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

  async function reject(paymentId: string, reason: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/payments/${paymentId}/reject`, { method: 'POST', body: { reason } });
      setRejectOpen(false);
      setRejectReason('');
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
      setGrantOpen(false);
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
      setManualOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create payment');
    } finally {
      setBusy(false);
    }
  }

  function payingFor(row: Payment) {
    if (row.kind === 'ORDER' && row.orderId) {
      return { label: row.planName ?? 'Hardware order', href: `/admin/hardware-orders` };
    }
    if (row.planId) {
      return { label: row.planName ?? 'Plan', href: `/admin/plans` };
    }
    return { label: row.planName ?? '—', href: null };
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Razorpay activates on its own. UPI and cash wait here until you verify money arrived."
        actions={
          <>
            <button type="button" className="admin-btn-secondary" onClick={() => setGrantOpen(true)}>
              Grant free access
            </button>
            <button type="button" className="admin-btn-secondary" onClick={() => setManualOpen(true)}>
              Record UPI / cash
            </button>
          </>
        }
      />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-border-soft)] p-1">
        {(
          [
            ['pending', `To verify (${tabCounts.pending})`],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
            ['razorpay', 'Razorpay'],
            ['all', 'All'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              tab === id ? 'bg-[var(--admin-surface)] shadow-sm' : 'text-[var(--admin-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="admin-card p-4">
          <ul className="max-h-[70vh] space-y-2 overflow-y-auto">
            {filteredList.length === 0 ? (
              <li className="admin-meta text-sm">Nothing in this tab.</li>
            ) : (
              filteredList.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id);
                      setParams((p) => {
                        const next = new URLSearchParams(p);
                        next.set('payment', row.id);
                        return next;
                      });
                    }}
                    className={`w-full rounded-[var(--admin-radius-ctl)] border px-3 py-3 text-left ${
                      selected?.id === row.id
                        ? 'border-[var(--admin-brand)] bg-[var(--admin-brand-soft)]'
                        : 'border-[var(--admin-border)] hover:border-[var(--admin-brand)]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{formatINR(row.amountInr)}</p>
                      <span className="rounded-full bg-[var(--admin-border-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-muted)]">
                        {relativeAge(row.createdAt)}
                      </span>
                    </div>
                    <p className="admin-meta text-xs">{row.provider ?? '—'} · {row.status}</p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="admin-card p-5">
          {selected ? (
            <>
              <p className="text-3xl font-extrabold">{formatINR(selected.amountInr)}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <DetailRow label="Merchant">
                  {selected.userId ? (
                    <Link to={`/admin/merchants/${selected.userId}`} className="font-semibold text-[var(--admin-brand)]">
                      {selected.userEmail ?? 'View merchant'}
                    </Link>
                  ) : (
                    '—'
                  )}
                </DetailRow>
                <DetailRow label="Location" value={selected.locationName ?? '—'} />
                <DetailRow label="Paying for">
                  {(() => {
                    const target = payingFor(selected);
                    return target.href ? (
                      <Link to={target.href} className="font-semibold text-[var(--admin-brand)]">{target.label}</Link>
                    ) : (
                      target.label
                    );
                  })()}
                </DetailRow>
                <DetailRow label="Submitted" value={formatDateTime(selected.createdAt)} />
              </dl>

              {selected.status === 'PENDING' && selected.provider === 'UPI' && !isValidUtr(effectiveUtr) ? (
                <div className="admin-pill-warn mt-4 rounded-[var(--admin-radius-ctl)] px-3 py-2 text-sm">
                  UTR missing — enter the 12-digit bank reference before approving.
                </div>
              ) : null}

              {selected.status === 'PENDING' && selected.provider === 'UPI' ? (
                <label className="mt-4 block text-sm">
                  <span className="admin-label">UTR (12 digits)</span>
                  <input
                    value={utrInput}
                    onChange={(e) => setUtrInput(utrDigitsOnly(e.target.value))}
                    inputMode="numeric"
                    maxLength={12}
                    className="admin-ctl admin-ctl-form mt-1 w-full px-3 font-mono-admin text-sm"
                    placeholder="123456789012"
                  />
                </label>
              ) : null}

              {selected.status === 'PENDING' ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !canApprove}
                      onClick={() => void approve(selected.id, effectiveUtr || undefined)}
                      className="admin-btn-primary disabled:opacity-50"
                    >
                      Approve &amp; mark paid
                    </button>
                    <button type="button" className="admin-btn-secondary text-sm" disabled={busy}>
                      Ask merchant for UTR
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRejectOpen(true)}
                    className="admin-btn-secondary text-sm"
                  >
                    Reject…
                  </button>
                </div>
              ) : (
                <p className="admin-meta mt-4 text-sm">Reference: {selected.referenceNote ?? '—'}</p>
              )}
            </>
          ) : (
            <p className="admin-meta text-sm">Select a payment to review.</p>
          )}
        </section>
      </div>

      <Modal open={grantOpen} title="Grant free access" onClose={() => setGrantOpen(false)}>
        <form onSubmit={onComp} className="space-y-3">
          <LocationPicker value={comp.locationId} onChange={(id) => setComp((v) => ({ ...v, locationId: id }))} />
          <select
            value={comp.planId}
            onChange={(e) => setComp((v) => ({ ...v, planId: e.target.value }))}
            className="admin-ctl admin-ctl-form w-full px-3 text-sm"
          >
            <option value="">Choose plan</option>
            {plans.filter((p) => p.isActive).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {productDisplayName(plan.product)} — {plan.name}
              </option>
            ))}
          </select>
          <textarea
            value={comp.reason}
            onChange={(e) => setComp((v) => ({ ...v, reason: e.target.value }))}
            rows={2}
            className="w-full rounded-[var(--admin-radius-ctl)] border border-[var(--admin-border)] px-3 py-2 text-sm"
            placeholder="Reason (required)"
          />
          <button type="submit" disabled={busy} className="admin-btn-primary">Grant access</button>
        </form>
      </Modal>

      <Modal open={manualOpen} title="Record UPI / cash" onClose={() => setManualOpen(false)}>
        <form onSubmit={onManual} className="space-y-3">
          <LocationPicker value={manual.locationId} onChange={(id) => setManual((v) => ({ ...v, locationId: id }))} />
          <select
            value={manual.planId}
            onChange={(e) => setManual((v) => ({ ...v, planId: e.target.value }))}
            className="admin-ctl admin-ctl-form w-full px-3 text-sm"
          >
            <option value="">Choose plan</option>
            {plans.filter((p) => p.amountInr > 0).map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name} ({formatINR(plan.amountInr)})</option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="admin-btn-primary">Create pending payment</button>
        </form>
      </Modal>

      <Modal open={rejectOpen} title="Reject payment" onClose={() => setRejectOpen(false)}>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          className="w-full rounded-[var(--admin-radius-ctl)] border border-[var(--admin-border)] px-3 py-2 text-sm"
          placeholder="Reason for rejection"
        />
        <button
          type="button"
          disabled={busy || rejectReason.trim().length < 3}
          onClick={() => selected && void reject(selected.id, rejectReason.trim())}
          className="admin-btn-danger-outline mt-3"
        >
          Reject payment
        </button>
      </Modal>
    </div>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--admin-border-soft)] pb-2">
      <dt className="text-[var(--admin-muted)]">{label}</dt>
      <dd className="font-medium text-right text-[var(--admin-text)]">{children ?? value}</dd>
    </div>
  );
}

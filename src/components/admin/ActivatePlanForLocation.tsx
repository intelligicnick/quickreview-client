import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import { inr } from '../../lib/admin-ui';

type Plan = {
  id: string;
  code: string;
  name: string;
  product: string;
  amountInr: number;
  durationDays: number;
  isActive: boolean;
};

const PRODUCT_LABEL: Record<string, string> = {
  QUICK_REVIEW: 'QuickReview',
  QUICK_MENU: 'QuickCommerce',
  QUICK_CRM: 'CRM',
  QUICK_CONNECT: 'QuickConnect',
  QUICK_DESIGN: 'QuickDesign',
  QUICK_SCAN: 'QuickScan',
};

type Props = {
  locationId: string;
  locationName: string;
  onActivated?: () => void;
  compact?: boolean;
};

export function ActivatePlanForLocation({ locationId, locationName, onActivated, compact }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState('');
  const [reason, setReason] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void api<Plan[]>('/api/admin/plans')
      .then((rows) => setPlans(rows.filter((p) => p.isActive)))
      .catch(() => setPlans([]));
  }, []);

  const planOptions = useMemo(() => {
    return plans
      .map((plan) => {
        const product = PRODUCT_LABEL[plan.product] ?? plan.product;
        const price =
          plan.amountInr === 0 ? `free · ${plan.durationDays}d` : `${inr(plan.amountInr)} · ${plan.durationDays}d`;
        return { plan, label: `${product} — ${plan.name} (${price})` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [plans]);

  useEffect(() => {
    const picked = plans.find((p) => p.id === planId);
    if (picked && !durationDays) setDurationDays(String(picked.durationDays));
  }, [planId, plans, durationDays]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!planId || reason.trim().length < 3) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ id: string; endDate: string }>('/api/admin/subscriptions/comp', {
        method: 'POST',
        body: {
          locationId,
          planId,
          reason: reason.trim(),
          durationDays: Number(durationDays) > 0 ? Number(durationDays) : undefined,
        },
      });
      setMessage(`Active until ${result.endDate}`);
      setReason('');
      onActivated?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not activate plan');
    } finally {
      setBusy(false);
    }
  }

  if (!planOptions.length) return null;

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={compact ? 'mt-3 border-t border-line pt-3' : 'mt-4 rounded-xl border border-line bg-paper/50 p-3'}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Activate plan</p>
      {!compact ? (
        <p className="mt-0.5 text-xs text-muted">Grants access for {locationName} (logged in admin activity).</p>
      ) : null}
      <select
        value={planId}
        onChange={(e) => setPlanId(e.target.value)}
        className="mt-2 min-h-10 w-full rounded-xl border border-line bg-white px-3 text-sm"
      >
        <option value="">Choose product / plan</option>
        {planOptions.map(({ plan, label }) => (
          <option key={plan.id} value={plan.id}>{label}</option>
        ))}
      </select>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          type="number"
          min={1}
          max={3650}
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
          className="min-h-10 w-28 rounded-xl border border-line bg-white px-3 text-sm"
          placeholder="Days"
          aria-label="Duration in days"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-10 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-sm"
          placeholder="Reason (required)"
        />
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-xs font-semibold text-brand-dark">{message}</p> : null}
      <button
        type="submit"
        disabled={busy || !planId || reason.trim().length < 3}
        className="mt-2 min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Activating…' : 'Activate'}
      </button>
    </form>
  );
}

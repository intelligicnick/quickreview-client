import { useEffect, useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { ProductStatusBadge } from '../components/ProductStatusBadge';
import { formatPlanEnd } from '../lib/format-plan-date';
import { useLocationContext } from '../lib/location-context';
import { openRazorpayCheckout } from '../lib/razorpay-checkout';

type Plan = {
  id: string;
  code: string;
  name: string;
  product: string;
  amountInr: number;
  durationDays: number;
};

type ProductAccess = {
  unlocked: boolean;
  status: string;
  planName: string | null;
  endDate: string | null;
  amountInr: number | null;
  pendingPaymentId: string | null;
};

type Billing = {
  locationId: string;
  locationName: string;
  products: {
    quickReview: ProductAccess;
    quickMenu: ProductAccess;
    quickConnect: ProductAccess;
    quickDesign: ProductAccess;
    quickScan: ProductAccess;
    quickCrm: ProductAccess;
  };
  plans: Plan[];
};

type ProductKey =
  | 'quickReview'
  | 'quickMenu'
  | 'quickConnect'
  | 'quickDesign'
  | 'quickScan'
  | 'quickCrm';

const PRODUCT_ROWS: { key: ProductKey; name: string; planProduct: string; blurb: string }[] = [
  { key: 'quickReview', name: 'QuickReview', planProduct: 'QUICK_REVIEW', blurb: 'Review QR, inbox, Google handoff' },
  { key: 'quickMenu', name: 'QuickCommerce', planProduct: 'QUICK_MENU', blurb: 'Catalogue, menu & Quick Revisit' },
  { key: 'quickCrm', name: 'QuickCRM', planProduct: 'QUICK_CRM', blurb: 'Customers, quotes, invoices' },
  { key: 'quickConnect', name: 'QuickConnect', planProduct: 'QUICK_CONNECT', blurb: 'Digital card & leads' },
  { key: 'quickDesign', name: 'QuickDesign', planProduct: 'QUICK_DESIGN', blurb: 'Social posters' },
  { key: 'quickScan', name: 'QuickScan', planProduct: 'QUICK_SCAN', blurb: 'Visiting card scan → CRM' },
];

type PayMethod = 'RAZORPAY' | 'UPI' | 'CASH' | 'TRIAL';

export function SubscriptionPage() {
  const { selected } = useLocationContext();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState<ProductKey | null>(null);
  const [planId, setPlanId] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('RAZORPAY');

  useEffect(() => {
    if (!selected) {
      setBilling(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<Billing>(`/api/billing/locations/${selected.id}`);
        if (!cancelled) {
          setBilling(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load billing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function reloadBilling() {
    if (!selected) return;
    const data = await api<Billing>(`/api/billing/locations/${selected.id}`);
    setBilling(data);
  }

  const plansForKey = useMemo(() => {
    if (!billing || !checkoutKey) return [];
    const row = PRODUCT_ROWS.find((r) => r.key === checkoutKey);
    if (!row) return [];
    return billing.plans.filter((p) => p.product === row.planProduct);
  }, [billing, checkoutKey]);

  const selectedPlan = plansForKey.find((p) => p.id === planId) ?? plansForKey[0];

  useEffect(() => {
    if (!checkoutKey || plansForKey.length === 0) return;
    setPlanId(plansForKey[0].id);
    const trial = plansForKey.find((p) => p.amountInr === 0);
    setPayMethod(trial && plansForKey.length === 1 ? 'TRIAL' : 'RAZORPAY');
  }, [checkoutKey, plansForKey]);

  async function runCheckout() {
    if (!selected || !selectedPlan) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const provider =
        selectedPlan.amountInr === 0 ? undefined : payMethod === 'TRIAL' ? undefined : payMethod;
      const result = await api<{
        message: string;
        status: string;
        razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
      }>(`/api/billing/locations/${selected.id}/checkout`, {
        method: 'POST',
        body: provider ? { planId: selectedPlan.id, provider } : { planId: selectedPlan.id },
      });

      if (result.razorpay) {
        await openRazorpayCheckout(result.razorpay, () => {
          setMessage('Payment received — your plan should activate in a few seconds.');
          void reloadBilling();
          setCheckoutKey(null);
        });
      } else {
        setMessage(result.message);
        await reloadBilling();
        setCheckoutKey(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <CreditCard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Plans & billing</h1>
          <p className="text-sm text-muted">One status per product for this location — pick a plan when you&apos;re ready.</p>
        </div>
      </div>

      {!selected ? (
        <p className="mt-4 text-sm text-muted">Select a location at the top to manage billing.</p>
      ) : (
        <p className="mt-4 text-sm">
          Billing for <span className="font-semibold">{selected.name}</span>
        </p>
      )}

      {message ? (
        <p className="mt-4 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>
      ) : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && billing ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/80 text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Renewal</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_ROWS.map((row) => {
                const product = billing.products[row.key];
                const renewal = formatPlanEnd(product.endDate);
                return (
                  <tr key={row.key} className="border-b border-line last:border-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{row.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{row.blurb}</p>
                      <div className="mt-2 sm:hidden">
                        <ProductStatusBadge unlocked={product.unlocked} status={product.status} />
                        {renewal ? <p className="mt-1 text-xs text-muted">{renewal}</p> : null}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <ProductStatusBadge unlocked={product.unlocked} status={product.status} />
                    </td>
                    <td className="hidden px-4 py-4 text-muted md:table-cell">
                      {renewal ?? (product.planName ? product.planName : '—')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {product.unlocked ? (
                        <span className="text-muted">Active</span>
                      ) : product.status === 'PENDING_PAYMENT' ? (
                        <span className="text-amber-800">Awaiting confirmation</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setCheckoutKey(row.key)}
                          className="inline-flex min-h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                        >
                          Choose plan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {checkoutKey && billing && selectedPlan ? (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">
                Checkout — {PRODUCT_ROWS.find((r) => r.key === checkoutKey)?.name}
              </p>
              <p className="mt-1 text-sm text-muted">Pick a plan and payment method, then continue once.</p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-muted hover:text-ink"
              onClick={() => setCheckoutKey(null)}
            >
              Close
            </button>
          </div>
          <label className="mt-4 block text-sm font-semibold">
            Plan
            <select
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
              value={selectedPlan.id}
              onChange={(e) => setPlanId(e.target.value)}
            >
              {plansForKey.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {plan.amountInr === 0 ? 'Free trial' : `₹${plan.amountInr}`} · {plan.durationDays} days
                </option>
              ))}
            </select>
          </label>
          {selectedPlan.amountInr > 0 ? (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Payment method</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['RAZORPAY', 'UPI', 'CASH'] as const).map((method) => (
                  <label
                    key={method}
                    className={`inline-flex min-h-10 cursor-pointer items-center rounded-xl border px-3 text-sm font-semibold ${
                      payMethod === method ? 'border-brand bg-brand/10 text-brand-dark' : 'border-line'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      className="sr-only"
                      checked={payMethod === method}
                      onChange={() => setPayMethod(method)}
                    />
                    {method === 'RAZORPAY' ? 'Razorpay' : method === 'UPI' ? 'UPI (manual)' : 'Cash'}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void runCheckout()}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {busy ? 'Working…' : selectedPlan.amountInr === 0 ? 'Start trial' : 'Continue to pay'}
          </button>
        </div>
      ) : null}

      <p className="mt-8 text-xs text-muted">
        Razorpay activates automatically via webhook. UPI/cash stays pending until Super Admin marks it paid.
      </p>
    </div>
  );
}

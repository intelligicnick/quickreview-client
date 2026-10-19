import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProductStatusBadge } from '../components/ProductStatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { deriveProductPlanStatus, formatMerchantDate } from '../lib/product-access';
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
  { key: 'quickCrm', name: 'CRM', planProduct: 'QUICK_CRM', blurb: 'Customers, quotes, invoices' },
  { key: 'quickConnect', name: 'QuickConnect', planProduct: 'QUICK_CONNECT', blurb: 'Digital card & leads' },
  { key: 'quickDesign', name: 'QuickDesign', planProduct: 'QUICK_DESIGN', blurb: 'Social posters' },
  { key: 'quickScan', name: 'QuickScan', planProduct: 'QUICK_SCAN', blurb: 'Visiting card scan → CRM' },
];

type PayMethod = 'RAZORPAY' | 'UPI' | 'CASH';

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
    setPayMethod('RAZORPAY');
  }, [checkoutKey, plansForKey]);

  const expiredRows = useMemo(() => {
    if (!billing) return [];
    return PRODUCT_ROWS.filter((row) => deriveProductPlanStatus(billing.products[row.key]) === 'EXPIRED');
  }, [billing]);

  const renewAllInr = useMemo(() => {
    if (!billing) return 0;
    return expiredRows.reduce((sum, row) => sum + (billing.products[row.key].amountInr ?? 0), 0);
  }, [billing, expiredRows]);

  async function runCheckout() {
    if (!selected || !selectedPlan) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const provider = payMethod;
      const result = await api<{
        message: string;
        status: string;
        razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
      }>(`/api/billing/locations/${selected.id}/checkout`, {
        method: 'POST',
        body: { planId: selectedPlan.id, provider },
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
      <PageHeader
        breadcrumb="This location / Plans & billing"
        title="Plans & billing"
        description={
          selected
            ? `Billing is per location. You're viewing ${selected.businessName} · ${selected.name}.`
            : "Billing is per location — renew or upgrade when you're ready."
        }
      />

      {!selected ? <p className="text-sm text-muted">Select a location in the sidebar to manage billing.</p> : null}

      {message ? (
        <p className="rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && billing && expiredRows.length > 0 ? (
        <div className="rounded-[10px] border border-amber-line bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">
            All {expiredRows.length} product{expiredRows.length === 1 ? '' : 's'} expired
            {expiredRows[0] ? ` on ${formatMerchantDate(billing.products[expiredRows[0].key].endDate)}` : ''}.
          </p>
          <button
            type="button"
            className="mt-2 font-semibold underline"
            onClick={() => setCheckoutKey(expiredRows[0].key)}
          >
            Renew all · ₹{renewAllInr.toLocaleString('en-IN')}
          </button>
        </div>
      ) : null}

      {selected && billing ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valid until</th>
                <th className="w-0 whitespace-nowrap px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_ROWS.map((row) => {
                const product = billing.products[row.key];
                const planStatus = deriveProductPlanStatus(product);
                const validUntil = formatMerchantDate(product.endDate);
                return (
                  <tr key={row.key} className="border-b border-line last:border-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{row.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{row.blurb}</p>
                    </td>
                    <td className="px-4 py-4">
                      <ProductStatusBadge
                        unlocked={product.unlocked}
                        status={product.status}
                        endDate={product.endDate}
                        pendingPaymentId={product.pendingPaymentId}
                      />
                    </td>
                    <td className="px-4 py-4 text-muted">{validUntil}</td>
                    <td className="w-0 whitespace-nowrap px-4 py-4 text-right">
                      {planStatus === 'EXPIRED' ? (
                        <Button size="sm" className="whitespace-nowrap" disabled={busy} onClick={() => setCheckoutKey(row.key)}>
                          Renew
                        </Button>
                      ) : planStatus === 'PENDING_PAYMENT' ? (
                        <span className="text-sm font-semibold text-amber-800">Awaiting confirmation</span>
                      ) : planStatus === 'ACTIVE' || planStatus === 'TRIAL' ? (
                        <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => setCheckoutKey(row.key)}>
                          Manage
                        </Button>
                      ) : (
                        <Button size="sm" className="whitespace-nowrap" disabled={busy} onClick={() => setCheckoutKey(row.key)}>
                          Choose plan
                        </Button>
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
                  {plan.name} — ₹{plan.amountInr} · {plan.durationDays} days
                </option>
              ))}
            </select>
          </label>
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
          <button
            type="button"
            disabled={busy}
            onClick={() => void runCheckout()}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {busy ? 'Working…' : `Continue to pay · ₹${selectedPlan.amountInr}`}
          </button>
        </div>
      ) : null}

      {selected && billing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="text-[17px] font-bold text-ink">Razorpay</h2>
            <p className="mt-1 text-sm text-muted">Card, UPI, and netbanking — your plan activates instantly after payment.</p>
          </Card>
          <Card>
            <h2 className="text-[17px] font-bold text-ink">UPI or cash</h2>
            <p className="mt-1 text-sm text-muted">
              Pay offline and we&apos;ll confirm manually. Access stays pending until payment is verified.
            </p>
          </Card>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        Razorpay activates automatically via webhook. UPI and cash stay pending until our team confirms payment.
      </p>
    </div>
  );
}

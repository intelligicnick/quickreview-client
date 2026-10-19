import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProductStatusBadge } from '../components/ProductStatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { computeCheckoutTotals, FULL_SUITE_PRODUCT_COUNT } from '../lib/billing-bundle';
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

function isPurchasable(access: ProductAccess): boolean {
  const s = deriveProductPlanStatus(access);
  return s === 'NONE' || s === 'EXPIRED';
}

export function SubscriptionPage() {
  const { selected } = useLocationContext();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<ProductKey[]>([]);
  const [planByKey, setPlanByKey] = useState<Partial<Record<ProductKey, string>>>({});
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

  const purchasableRows = useMemo(() => {
    if (!billing) return [];
    return PRODUCT_ROWS.filter((row) => isPurchasable(billing.products[row.key]));
  }, [billing]);

  useEffect(() => {
    if (!billing) return;
    setPlanByKey((prev) => {
      const next = { ...prev };
      for (const row of PRODUCT_ROWS) {
        const plans = billing.plans.filter((p) => p.product === row.planProduct);
        if (plans.length && !next[row.key]) next[row.key] = plans[0]!.id;
      }
      return next;
    });
  }, [billing]);

  const cartLines = useMemo(() => {
    if (!billing) return [];
    return selectedKeys
      .map((key) => {
        const row = PRODUCT_ROWS.find((r) => r.key === key)!;
        const planId = planByKey[key];
        const plan = billing.plans.find((p) => p.id === planId);
        if (!plan) return null;
        return { key, row, plan };
      })
      .filter(Boolean) as { key: ProductKey; row: (typeof PRODUCT_ROWS)[number]; plan: Plan }[];
  }, [billing, selectedKeys, planByKey]);

  const checkoutTotals = useMemo(() => {
    return computeCheckoutTotals(
      cartLines.map((line) => ({ product: line.plan.product, amountInr: line.plan.amountInr })),
    );
  }, [cartLines]);

  const expiredRows = useMemo(() => {
    if (!billing) return [];
    return PRODUCT_ROWS.filter((row) => deriveProductPlanStatus(billing.products[row.key]) === 'EXPIRED');
  }, [billing]);

  const renewAllTotals = useMemo(() => {
    if (!billing || purchasableRows.length === 0) {
      return { subtotalInr: 0, discountInr: 0, totalInr: 0 };
    }
    const lines = purchasableRows.map((row) => {
      const planId = planByKey[row.key];
      const plan =
        billing.plans.find((p) => p.id === planId) ??
        billing.plans.find((p) => p.product === row.planProduct);
      return { product: row.planProduct, amountInr: plan?.amountInr ?? 0 };
    });
    const t = computeCheckoutTotals(lines);
    return t;
  }, [billing, purchasableRows, planByKey]);

  function toggleKey(key: ProductKey) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    setCartOpen(true);
  }

  function selectAllPurchasable() {
    setSelectedKeys(purchasableRows.map((r) => r.key));
    setCartOpen(true);
  }

  function openRenewAll() {
    selectAllPurchasable();
  }

  function addSingleToCart(key: ProductKey) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setCartOpen(true);
  }

  async function runCheckout() {
    if (!selected || cartLines.length === 0) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const planIds = cartLines.map((line) => line.plan.id);
      const provider = payMethod;
      const result = await api<{
        message: string;
        status: string;
        razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
      }>(`/api/billing/locations/${selected.id}/checkout`, {
        method: 'POST',
        body: { planIds, provider },
      });

      if (result.razorpay) {
        await openRazorpayCheckout(result.razorpay, () => {
          setMessage('Payment received — your plans should activate in a few seconds.');
          void reloadBilling();
          setCartOpen(false);
          setSelectedKeys([]);
        });
      } else {
        setMessage(result.message);
        await reloadBilling();
        setCartOpen(false);
        setSelectedKeys([]);
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
            {expiredRows.length} product{expiredRows.length === 1 ? '' : 's'} expired
            {expiredRows[0] ? ` (latest ${formatMerchantDate(billing.products[expiredRows[0].key].endDate)})` : ''}.
          </p>
          <button type="button" className="mt-2 font-semibold underline" onClick={openRenewAll}>
            Renew all purchasable · ₹{renewAllTotals.totalInr.toLocaleString('en-IN')}
            {renewAllTotals.discountInr > 0 ? ' (30% off full suite)' : ''}
          </button>
        </div>
      ) : null}

      {selected && billing && purchasableRows.length >= 2 ? (
        <p className="text-sm text-muted">
          <button type="button" className="font-semibold text-brand underline" onClick={selectAllPurchasable}>
            Select all {purchasableRows.length} purchasable
          </button>
          {purchasableRows.length === FULL_SUITE_PRODUCT_COUNT ? ' · save 30% when all six are in one payment' : null}
        </p>
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
                const purchasable = isPurchasable(product);
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
                      {planStatus === 'PENDING_PAYMENT' ? (
                        <span className="text-sm font-semibold text-amber-800">Awaiting confirmation</span>
                      ) : planStatus === 'ACTIVE' || planStatus === 'TRIAL' ? (
                        <span className="text-sm font-semibold text-muted">Active</span>
                      ) : purchasable ? (
                        <Button
                          size="sm"
                          className="whitespace-nowrap"
                          disabled={busy}
                          onClick={() => addSingleToCart(row.key)}
                        >
                          {planStatus === 'EXPIRED' ? 'Renew' : 'Choose plan'}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {selected && billing && cartOpen && purchasableRows.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">Checkout</p>
              <p className="mt-1 text-sm text-muted">
                Select products to include in one payment. Full suite (all 6) gets 30% off.
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-muted hover:text-ink"
              onClick={() => setCartOpen(false)}
            >
              Close
            </button>
          </div>

          <ul className="mt-4 space-y-3">
            {purchasableRows.map((row) => {
              const plans = billing.plans.filter((p) => p.product === row.planProduct);
              const checked = selectedKeys.includes(row.key);
              return (
                <li key={row.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                  <label className="inline-flex min-w-[140px] cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKey(row.key)}
                    />
                    {row.name}
                  </label>
                  {checked && plans.length > 0 ? (
                    <select
                      className="min-w-[200px] flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                      value={planByKey[row.key] ?? plans[0]!.id}
                      onChange={(e) => setPlanByKey((prev) => ({ ...prev, [row.key]: e.target.value }))}
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — ₹{plan.amountInr} · {plan.durationDays} days
                        </option>
                      ))}
                    </select>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {selectedKeys.length > 0 ? (
            <>
              <div className="mt-4 space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{checkoutTotals.subtotalInr.toLocaleString('en-IN')}</span>
                </p>
                {checkoutTotals.discountInr > 0 ? (
                  <p className="flex justify-between text-brand-dark">
                    <span>Full suite discount (30%)</span>
                    <span>−₹{checkoutTotals.discountInr.toLocaleString('en-IN')}</span>
                  </p>
                ) : null}
                <p className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{checkoutTotals.totalInr.toLocaleString('en-IN')}</span>
                </p>
              </div>

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
                disabled={busy || cartLines.length === 0}
                onClick={() => void runCheckout()}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {busy ? 'Working…' : `Continue to pay · ₹${checkoutTotals.totalInr.toLocaleString('en-IN')}`}
              </button>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">Select at least one product above.</p>
          )}
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

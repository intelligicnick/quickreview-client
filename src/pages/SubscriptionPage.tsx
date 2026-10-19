import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import {
  BILLING_PRODUCTS,
  isPurchasableForCheckout,
  monthlyPlanId,
  trialStatusLabel,
  type ProductKey,
} from '../lib/billing-catalog';
import { computeCheckoutTotals, FULL_SUITE_PRODUCT_COUNT } from '../lib/billing-bundle';
import { deriveProductPlanStatus, formatMerchantDate, productStatusLabelFromAccess } from '../lib/product-access';
import { useLocationContext } from '../lib/location-context';
import { openRazorpayCheckout } from '../lib/razorpay-checkout';
import { ProductStatusBadge } from '../components/ProductStatusBadge';

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
  products: Record<ProductKey, ProductAccess>;
  plans: Plan[];
};

type PayMethod = 'RAZORPAY' | 'UPI' | 'CASH';

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function SubscriptionPage() {
  const { selected } = useLocationContext();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<ProductKey[]>([]);
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
    return BILLING_PRODUCTS.filter((row) => isPurchasableForCheckout(billing.products[row.key]));
  }, [billing]);

  useEffect(() => {
    if (!billing) return;
    setSelectedKeys(purchasableRows.map((row) => row.key));
  }, [billing, purchasableRows]);

  const monthlyPrices = useMemo(() => {
    if (!billing) return new Map<ProductKey, number>();
    const map = new Map<ProductKey, number>();
    for (const row of BILLING_PRODUCTS) {
      const id = monthlyPlanId(billing.plans, row.planProduct);
      const plan = billing.plans.find((p) => p.id === id);
      if (plan) map.set(row.key, plan.amountInr);
    }
    return map;
  }, [billing]);

  const fullSuiteSubtotal = useMemo(() => {
    let sum = 0;
    for (const row of BILLING_PRODUCTS) {
      sum += monthlyPrices.get(row.key) ?? 0;
    }
    return sum;
  }, [monthlyPrices]);

  const fullSuiteTotals = useMemo(() => {
    const lines = BILLING_PRODUCTS.map((row) => ({
      product: row.planProduct,
      amountInr: monthlyPrices.get(row.key) ?? 0,
    }));
    return computeCheckoutTotals(lines);
  }, [monthlyPrices]);

  const cartLines = useMemo(() => {
    if (!billing) return [];
    return selectedKeys
      .map((key) => {
        const row = BILLING_PRODUCTS.find((r) => r.key === key)!;
        const planId = monthlyPlanId(billing.plans, row.planProduct);
        const plan = billing.plans.find((p) => p.id === planId);
        if (!plan) return null;
        return { key, row, plan };
      })
      .filter(Boolean) as { key: ProductKey; row: (typeof BILLING_PRODUCTS)[number]; plan: Plan }[];
  }, [billing, selectedKeys]);

  const checkoutTotals = useMemo(() => {
    return computeCheckoutTotals(
      cartLines.map((line) => ({ product: line.plan.product, amountInr: line.plan.amountInr })),
    );
  }, [cartLines]);

  const trialBanner = useMemo(() => {
    if (!billing) return null;
    const endingToday = BILLING_PRODUCTS.filter((row) => {
      const label = trialStatusLabel(billing.products[row.key]);
      return label === 'Trial ends today';
    });
    if (endingToday.length > 0) return 'Your free trial ends today';
    const onTrial = purchasableRows.some((row) =>
      billing.products[row.key].planName?.toLowerCase().includes('trial'),
    );
    if (onTrial) return 'Your trial is ending soon';
    const expired = BILLING_PRODUCTS.filter(
      (row) => deriveProductPlanStatus(billing.products[row.key]) === 'EXPIRED',
    );
    if (expired.length > 0) return `${expired.length} product${expired.length === 1 ? '' : 's'} need renewal`;
    return null;
  }, [billing, purchasableRows]);

  const allSuiteSelected =
    purchasableRows.length === FULL_SUITE_PRODUCT_COUNT &&
    selectedKeys.length === FULL_SUITE_PRODUCT_COUNT &&
    BILLING_PRODUCTS.every((row) => selectedKeys.includes(row.key));

  function toggleKey(key: ProductKey) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function selectFullSuite() {
    setSelectedKeys(purchasableRows.map((row) => row.key));
  }

  async function runCheckout() {
    if (!selected || cartLines.length === 0) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const planIds = cartLines.map((line) => line.plan.id);
      const result = await api<{
        message: string;
        status: string;
        razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
      }>(`/api/billing/locations/${selected.id}/checkout`, {
        method: 'POST',
        body: { planIds, provider: payMethod },
      });

      if (result.razorpay) {
        await openRazorpayCheckout(result.razorpay, () => {
          setMessage('Payment received — your plans should activate in a few seconds.');
          void reloadBilling();
          setSelectedKeys([]);
        });
      } else {
        setMessage(result.message);
        await reloadBilling();
        setSelectedKeys([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  if (!selected) {
    return <p className="text-sm text-muted">Select a location in the sidebar to manage billing.</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <header className="text-center">
        <p className="text-sm font-semibold text-muted">
          {selected.businessName} — {selected.name}
        </p>
        {trialBanner ? (
          <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">{trialBanner}</h1>
        ) : (
          <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-ink">Plans & billing</h1>
        )}
        <p className="mt-2 text-sm text-muted">
          Tap the products you want to keep. Everything you set up stays as it is.
        </p>
      </header>

      {message ? (
        <p className="rounded-xl bg-brand/10 px-3 py-2 text-center text-sm text-brand-dark">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p> : null}

      {billing && purchasableRows.length > 0 ? (
        <>
          <section>
            <h2 className="text-center text-lg font-bold text-ink">Choose what you need</h2>
            <p className="mt-1 text-center text-sm text-muted">
              Pick one, two, or take everything and save 30%. Billed every 30 days.
            </p>

            {purchasableRows.length === FULL_SUITE_PRODUCT_COUNT ? (
              <button
                type="button"
                onClick={selectFullSuite}
                className={`mt-4 w-full rounded-2xl border-2 p-4 text-left transition-colors ${
                  allSuiteSelected ? 'border-brand bg-brand/5' : 'border-line bg-white hover:border-brand/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">
                      All 6 products <span className="text-brand">Save 30%</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Review, Commerce, Connect, Design, Scan and CRM together
                    </p>
                    <p className="mt-3 text-sm">
                      <span className="text-muted line-through">{formatInr(fullSuiteSubtotal)}</span>
                      <span className="ml-2 text-lg font-bold text-ink">
                        {formatInr(fullSuiteTotals.totalInr)}/mo
                      </span>
                    </p>
                  </div>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      allSuiteSelected ? 'border-brand bg-brand text-white' : 'border-line bg-white text-transparent'
                    }`}
                    aria-hidden
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                </div>
              </button>
            ) : null}

            <p className="mt-5 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              or pick single products
            </p>

            <ul className="mt-3 space-y-2">
              {purchasableRows.map((row) => {
                const access = billing.products[row.key];
                const price = monthlyPrices.get(row.key) ?? 0;
                const checked = selectedKeys.includes(row.key);
                const trialLabel = trialStatusLabel(access);
                return (
                  <li key={row.key}>
                    <button
                      type="button"
                      onClick={() => toggleKey(row.key)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                        checked ? 'border-brand bg-brand/5' : 'border-line bg-white hover:border-brand/30'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          checked ? 'bg-brand text-white' : 'bg-surface-2 text-ink'
                        }`}
                      >
                        {row.badge}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{row.name}</p>
                        <p className="text-sm font-semibold text-ink">{formatInr(price)}/mo</p>
                        {trialLabel ? <p className="text-xs text-amber-800">{trialLabel}</p> : null}
                      </div>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                          checked ? 'border-brand bg-brand text-white' : 'border-line bg-white text-transparent'
                        }`}
                        aria-hidden
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selectedKeys.length > 0 ? (
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h2 className="font-bold text-ink">Your plan</h2>
              <div className="mt-3 space-y-1 text-sm">
                {checkoutTotals.discountInr > 0 ? (
                  <p className="flex justify-between text-brand-dark">
                    <span>All-products discount (30%)</span>
                    <span>− {formatInr(checkoutTotals.discountInr)}</span>
                  </p>
                ) : null}
                <p className="flex justify-between text-base font-bold text-ink">
                  <span>Total</span>
                  <span>{formatInr(checkoutTotals.totalInr)}/mo</span>
                </p>
              </div>

              <fieldset className="mt-4 border-t border-line pt-4">
                <legend className="text-xs font-semibold uppercase tracking-wide text-muted">Payment</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['RAZORPAY', 'UPI', 'CASH'] as const).map((method) => (
                    <label
                      key={method}
                      className={`inline-flex min-h-9 cursor-pointer items-center rounded-lg border px-3 text-xs font-semibold ${
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
                      {method === 'RAZORPAY' ? 'Razorpay' : method === 'UPI' ? 'UPI' : 'Cash'}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                disabled={busy || cartLines.length === 0}
                onClick={() => void runCheckout()}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? 'Working…' : `Continue to pay ${formatInr(checkoutTotals.totalInr)}`}
              </button>
              <p className="mt-3 text-center text-xs text-muted">GST extra as applicable · cancel anytime</p>
            </section>
          ) : (
            <p className="text-center text-sm text-muted">Select at least one product to continue.</p>
          )}
        </>
      ) : billing ? (
        <p className="text-center text-sm text-muted">All products are active on this location. Nothing to buy right now.</p>
      ) : null}

      {billing ? (
        <section className="rounded-2xl border border-line bg-surface-2/50 p-4">
          <h2 className="text-sm font-bold text-ink">Status at this location</h2>
          <ul className="mt-3 space-y-3">
            {BILLING_PRODUCTS.map((row) => {
              const product = billing.products[row.key];
              return (
                <li key={row.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{row.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">{formatMerchantDate(product.endDate)}</span>
                    <ProductStatusBadge
                      unlocked={product.unlocked}
                      status={product.status}
                      endDate={product.endDate}
                      pendingPaymentId={product.pendingPaymentId}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            {productStatusLabelFromAccess(billing.products.quickReview)} — per-product billing, 30-day cycles.
          </p>
        </section>
      ) : null}
    </div>
  );
}

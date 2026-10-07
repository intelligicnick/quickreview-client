import { useEffect, useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { api, ApiError } from '../lib/api';
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

function statusLabel(status: string, unlocked: boolean) {
  if (unlocked) return 'Active';
  if (status === 'PENDING_PAYMENT') return 'Pending payment';
  if (status === 'EXPIRED') return 'Expired';
  return 'No plan';
}

export function SubscriptionPage() {
  const { selected } = useLocationContext();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function checkout(planId: string, provider?: 'UPI' | 'CASH' | 'RAZORPAY') {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{
        message: string;
        status: string;
        razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
      }>(`/api/billing/locations/${selected.id}/checkout`, {
        method: 'POST',
        body: provider ? { planId, provider } : { planId },
      });

      if (result.razorpay) {
        await openRazorpayCheckout(result.razorpay, () => {
          setMessage('Payment received — your plan should activate in a few seconds.');
          void reloadBilling();
        });
      } else {
        setMessage(result.message);
        await reloadBilling();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  const review = billing?.products.quickReview;
  const connect = billing?.products.quickConnect;
  const quickMenu = billing?.products.quickMenu;
  const reviewPlans = billing?.plans.filter((plan) => plan.product === 'QUICK_REVIEW') ?? [];
  const connectPlans = billing?.plans.filter((plan) => plan.product === 'QUICK_CONNECT') ?? [];
  const menuPlans = billing?.plans.filter((plan) => plan.product === 'QUICK_MENU') ?? [];
  const designPlans = billing?.plans.filter((plan) => plan.product === 'QUICK_DESIGN') ?? [];
  const scanPlans = billing?.plans.filter((plan) => plan.product === 'QUICK_SCAN') ?? [];
  const crmPlans = billing?.plans.filter((plan) => plan.product === 'QUICK_CRM') ?? [];
  const quickDesign = billing?.products.quickDesign;
  const quickScan = billing?.products.quickScan;
  const quickCrm = billing?.products.quickCrm;

  function productBlock(
    title: string,
    blurb: string,
    product: ProductAccess | undefined,
    plans: Plan[],
    lockHint: string,
  ) {
    if (!product) return null;
    return (
      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold">{title}</p>
            <p className="mt-1 text-sm text-muted">{blurb}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              product.unlocked ? 'bg-brand/10 text-brand-dark' : 'bg-paper text-muted'
            }`}
          >
            {statusLabel(product.status, product.unlocked)}
          </span>
        </div>
        {product.unlocked && product.endDate ? (
          <p className="mt-3 text-sm text-muted">Renews / ends {product.endDate}</p>
        ) : null}
        {product.status === 'PENDING_PAYMENT' ? (
          <p className="mt-3 text-sm text-amber-900">
            Payment pending — complete Razorpay or wait for UPI/cash confirmation.
          </p>
        ) : null}
        {!product.unlocked && product.status !== 'PENDING_PAYMENT' ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Lock className="h-4 w-4" />
            {lockHint}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-line p-4">
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-1 text-2xl font-extrabold">
                {plan.amountInr === 0 ? 'Free' : `₹${plan.amountInr}`}
              </p>
              <p className="mt-1 text-xs text-muted">{plan.durationDays} days</p>
              {plan.amountInr === 0 ? (
                <button
                  type="button"
                  disabled={busy || product.unlocked}
                  onClick={() => void checkout(plan.id)}
                  className="mt-3 w-full rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Start trial
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    disabled={busy || product.unlocked || product.status === 'PENDING_PAYMENT'}
                    onClick={() => void checkout(plan.id, 'RAZORPAY')}
                    className="min-h-10 w-full rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Pay with Razorpay
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || product.unlocked || product.status === 'PENDING_PAYMENT'}
                      onClick={() => void checkout(plan.id, 'UPI')}
                      className="min-h-10 flex-1 rounded-xl border border-line text-sm font-semibold disabled:opacity-50"
                    >
                      UPI (manual)
                    </button>
                    <button
                      type="button"
                      disabled={busy || product.unlocked || product.status === 'PENDING_PAYMENT'}
                      onClick={() => void checkout(plan.id, 'CASH')}
                      className="min-h-10 flex-1 rounded-xl border border-line text-sm font-semibold disabled:opacity-50"
                    >
                      Cash
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <CreditCard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Subscription</h1>
          <p className="text-sm text-muted">
            Plans are per location. Unlock public links and QR codes for each product separately.
          </p>
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

      {selected && review
        ? productBlock(
            'QuickReview',
            'QR review page, private inbox, Google handoff',
            review,
            reviewPlans,
            'Review QR locked until you activate a plan below.',
          )
        : null}

      {selected && quickMenu
        ? productBlock(
            'Quick Commerce',
            'Digital menu, services list, or catalogue — includes Quick Revisit loyalty on any active plan',
            quickMenu,
            menuPlans,
            'Guest catalogue and Quick Revisit locked until you activate Quick Commerce below.',
          )
        : null}

      {selected && quickCrm
        ? productBlock(
            'Quick CRM',
            'Customers, quotations, invoices, follow-ups, and sales pipeline',
            quickCrm,
            crmPlans,
            'Quick CRM locked until you activate a plan below.',
          )
        : null}

      {selected && connect
        ? productBlock(
            'QuickConnect',
            'Digital business card at /c/your-slug with lead capture',
            connect,
            connectPlans,
            'Public card locked until you activate QuickConnect below.',
          )
        : null}

      {selected && quickDesign
        ? productBlock(
            'QuickDesign',
            'AI WhatsApp / Instagram story posters — photo or graphic-only modes',
            quickDesign,
            designPlans,
            'Poster generation locked until you activate QuickDesign below.',
          )
        : null}

      {selected && quickScan
        ? productBlock(
            'QuickScan',
            'Scan visiting cards (front, back, or both) and save contacts as vCard',
            quickScan,
            scanPlans,
            'Card scanning locked until you activate QuickScan below.',
          )
        : null}

      <p className="mt-8 text-xs text-muted">
        Razorpay activates automatically via webhook. UPI/cash stays pending until Super Admin marks it paid.
      </p>
    </div>
  );
}

import { Lock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../../lib/api';
import { useLocationContext } from '../../lib/location-context';

type ProductAccess = {
  unlocked: boolean;
  status: string;
};

export function CrmSubscriptionGate({ children }: { children: ReactNode }) {
  const { selected } = useLocationContext();
  const [access, setAccess] = useState<ProductAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setAccess(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const billing = await api<{ products: { quickCrm: ProductAccess } }>(
          `/api/billing/locations/${selected.id}`,
        );
        if (!cancelled) {
          setAccess(billing.products.quickCrm);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setAccess(null);
          setError(err instanceof ApiError ? err.message : 'Could not load billing');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  if (!selected) {
    return (
      <div>
        <p className="text-sm text-muted">Select a location at the top to use Quick CRM.</p>
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!access) {
    return <p className="text-sm text-muted">Loading Quick CRM…</p>;
  }

  if (!access.unlocked) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Users className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Quick CRM needs a plan</h2>
        <p className="mt-2 text-sm text-muted">
          Customers, quotations, and follow-ups unlock with an active Quick CRM subscription for{' '}
          <span className="font-semibold text-ink">{selected.name}</span>.
        </p>
        <Link
          to="/app/subscription"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white"
        >
          <Lock className="h-4 w-4" />
          View plans
        </Link>
      </div>
    );
  }

  return children;
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { adminWhen, inr } from '../../lib/admin-ui';
import type { PublicUser } from '../../lib/types';

type SubRow = {
  product: string;
  status: string;
  source: string;
  endDate: string;
  planName: string;
  isTrial: boolean;
  amountInr: number;
};

type Account = PublicUser & {
  businesses: {
    id: string;
    name: string;
    category: string | null;
    locations: {
      id: string;
      name: string;
      status: string;
      address: string | null;
      slug: string | null;
      reviewCode: string | null;
      menuMode: string;
    }[];
  }[];
  billing: {
    monthlyPaidInr: number;
    lifetimePaidInr: number;
    payments: {
      id: string;
      status: string;
      provider: string | null;
      amountInr: number;
      referenceNote: string | null;
      locationName: string | null;
      planName: string | null;
      createdAt: string;
    }[];
    subscriptions: (SubRow & { locationId: string; locationName: string })[];
    orders: {
      id: string;
      status: string;
      amountInr: number;
      productName: string;
      locationName: string;
      createdAt: string;
    }[];
    qrByLocation: Record<string, { code: string; isMenuQr: boolean | null }[]>;
  };
  history: { id: string; summary: string; createdAt: string }[];
};

const PRODUCT_SHORT: Record<string, string> = {
  QUICK_REVIEW: 'QuickReview',
  QUICK_MENU: 'QuickCommerce',
  QUICK_CRM: 'QuickCRM',
  QUICK_CONNECT: 'QuickConnect',
  QUICK_DESIGN: 'QuickDesign',
  QUICK_SCAN: 'QuickScan',
};

export function AdminUserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me, rememberImpersonation, forgetImpersonation, setSession } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<Account>(`/api/admin/users/${userId}`);
        if (!cancelled) setAccount(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this merchant');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const subsByLocation = useMemo(() => {
    if (!account) return new Map<string, (SubRow & { locationId: string })[]>();
    const map = new Map<string, (SubRow & { locationId: string })[]>();
    for (const sub of account.billing.subscriptions) {
      const list = map.get(sub.locationId) ?? [];
      list.push(sub);
      map.set(sub.locationId, list);
    }
    return map;
  }, [account]);

  async function patch(body: { isActive?: boolean; emailVerified?: boolean }, action: string) {
    if (!userId) return;
    setBusy(action);
    setError(null);
    try {
      await api(`/api/admin/users/${userId}`, { method: 'PATCH', body });
      const data = await api<Account>(`/api/admin/users/${userId}`);
      setAccount(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this account');
    } finally {
      setBusy(null);
    }
  }

  async function openPanel() {
    if (!userId || !account || !me) return;
    if (!window.confirm(`Open ${account.name}'s merchant panel? This is logged in the activity feed.`)) return;
    setBusy('login');
    setError(null);
    try {
      const minted = await api<{ ticket: string; resumeToken: string }>(
        `/api/admin/users/${userId}/login-as`,
        { method: 'POST' },
      );
      rememberImpersonation({
        resumeToken: minted.resumeToken,
        actorName: me.name,
        actorEmail: me.email,
      });
      try {
        const session = await api<{ user: PublicUser; accessToken: string }>('/api/auth/login-as', {
          method: 'POST',
          auth: false,
          body: { token: minted.ticket },
        });
        setSession(session.user, session.accessToken);
        navigate('/app', { replace: true });
      } catch (err) {
        forgetImpersonation();
        throw err;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open their panel');
      setBusy(null);
    }
  }

  if (!account && !error) return <p className="text-sm text-muted">Loading…</p>;

  const isSelf = account?.id === me?.id;
  const openItems =
    (account?.billing.payments.filter((p) => p.status === 'PENDING').length ?? 0) +
    (account?.billing.orders.filter((o) => o.status !== 'DELIVERED').length ?? 0);

  return (
    <div>
      <Link to="/admin/merchants" className="text-sm font-semibold text-brand">← Merchants</Link>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {account ? (
        <>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{account.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {account.email}
            {account.emailVerified ? ' · Email verified' : ' · Email not verified'}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {!account.isSuperAdmin ? (
              <button
                type="button"
                disabled={Boolean(busy) || !account.isActive}
                onClick={() => void openPanel()}
                className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {busy === 'login' ? 'Opening…' : 'Open their panel'}
              </button>
            ) : null}
            {!account.emailVerified ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void patch({ emailVerified: true }, 'verify')}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50"
              >
                Mark email verified
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Pays per month" value={inr(account.billing.monthlyPaidInr)} />
            <Stat label="Lifetime paid" value={inr(account.billing.lifetimePaidInr)} />
            <Stat
              label="Locations"
              value={String(account.businesses.reduce((n, b) => n + b.locations.length, 0))}
            />
            <Stat label="Open items" value={String(openItems)} />
          </div>

          <h2 className="mt-8 font-bold">Locations &amp; products</h2>
          <div className="mt-3 space-y-4">
            {account.businesses.flatMap((business) =>
              business.locations.map((location) => {
                const subs = subsByLocation.get(location.id) ?? [];
                const qr = account.billing.qrByLocation[location.id] ?? [];
                return (
                  <article key={location.id} className="rounded-2xl border border-line bg-white p-4">
                    <p className="font-semibold">{location.name}</p>
                    <p className="text-sm text-muted">
                      {business.category || 'Business'} · {location.status}
                      {location.address ? ` · ${location.address}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {subs.length === 0 ? (
                        <span className="rounded-full bg-paper px-2 py-1 text-xs font-semibold text-muted ring-1 ring-line">
                          No plans
                        </span>
                      ) : (
                        subs.map((sub) => (
                          <span
                            key={`${sub.product}-${sub.planName}`}
                            className="rounded-full bg-paper px-2 py-1 text-xs font-semibold ring-1 ring-line"
                          >
                            {PRODUCT_SHORT[sub.product] ?? sub.product}{' '}
                            {sub.status === 'ACTIVE'
                              ? sub.isTrial
                                ? `Trial · ${sub.endDate}`
                                : 'Active'
                              : sub.status}
                          </span>
                        ))
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {location.reviewCode ? `/r/${location.reviewCode}` : ''}
                      {location.slug ? ` · /go/${location.slug}` : ''}
                      {qr.length ? ` · ${qr.map((c) => c.code).join(', ')}` : ''}
                    </p>
                  </article>
                );
              }),
            )}
          </div>

          <h2 className="mt-8 font-bold">Payments &amp; orders</h2>
          <ul className="mt-3 space-y-2">
            {account.billing.payments.slice(0, 8).map((row) => (
              <li key={row.id} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
                <span className="font-semibold">{inr(row.amountInr)} · {row.provider ?? '—'}</span>
                <span className="text-muted"> · {row.planName ?? '—'} · {row.locationName ?? '—'}</span>
                <span className="block text-xs text-muted">{row.status} · {adminWhen(row.createdAt)}</span>
              </li>
            ))}
            {account.billing.orders.map((row) => (
              <li key={row.id} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
                <span className="font-semibold">Order · {row.productName}</span>
                <span className="text-muted"> · {row.locationName} · {inr(row.amountInr)}</span>
                <span className="block text-xs text-muted">{row.status} · {adminWhen(row.createdAt)}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-bold">History</h2>
          {account.history.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No admin actions logged for this email yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {account.history.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 text-sm">
                  <span>{row.summary}</span>
                  <span className="shrink-0 text-xs text-muted">{adminWhen(row.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}

          {!isSelf ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-4">
              <p className="font-semibold text-red-900">Disable account</p>
              <p className="mt-1 text-sm text-red-800">Public pages and QR codes stop working for this merchant.</p>
              {account.isActive ? (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void patch({ isActive: false }, 'disable')}
                  className="mt-3 min-h-11 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-900 disabled:opacity-50"
                >
                  {busy === 'disable' ? 'Disabling…' : 'Disable…'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void patch({ isActive: true }, 'enable')}
                  className="mt-3 min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold"
                >
                  Re-enable account
                </button>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

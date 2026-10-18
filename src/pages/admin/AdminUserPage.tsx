import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ActivatePlanForLocation } from '../../components/admin/ActivatePlanForLocation';
import { PageHeader } from '../../components/admin/PageHeader';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { productDisplayName } from '../../lib/admin-products';
import { formatDate, formatDateTime, formatINR } from '../../lib/admin-ui';
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
    qrByLocation: Record<
      string,
      { id: string; code: string; isMenuQr: boolean | null; isPrinted: boolean }[]
    >;
  };
  history: { id: string; summary: string; createdAt: string }[];
};

type Tab = 'overview' | 'locations' | 'billing' | 'orders' | 'history';

export function AdminUserPage() {
  const { userId } = useParams();
  const { user: me, rememberImpersonation, forgetImpersonation, setSession } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [activateLocationId, setActivateLocationId] = useState('');

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

  const allLocationsForEffect = account?.businesses.flatMap((b) => b.locations) ?? [];
  useEffect(() => {
    if (allLocationsForEffect[0] && !activateLocationId) {
      setActivateLocationId(allLocationsForEffect[0].id);
    }
  }, [account?.id, allLocationsForEffect, activateLocationId]);

  async function reloadAccount() {
    if (!userId) return;
    const data = await api<Account>(`/api/admin/users/${userId}`);
    setAccount(data);
  }

  async function patch(body: { isActive?: boolean; emailVerified?: boolean }, action: string) {
    if (!userId) return;
    setBusy(action);
    setError(null);
    try {
      await api(`/api/admin/users/${userId}`, { method: 'PATCH', body });
      await reloadAccount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this account');
    } finally {
      setBusy(null);
    }
  }

  async function openPanel() {
    if (!userId || !account || !me) return;
    if (
      !window.confirm(
        `Open ${account.name}'s merchant panel in a new tab? This action is logged in the activity feed.`,
      )
    )
      return;
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
        window.open('/app', '_blank', 'noopener,noreferrer');
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
  const locationCount = account?.businesses.reduce((n, b) => n + b.locations.length, 0) ?? 0;
  const allLocations = account?.businesses.flatMap((b) => b.locations) ?? [];
  const activateLocation =
    allLocations.find((l) => l.id === activateLocationId) ?? allLocations[0] ?? null;

  const pendingPayments = account?.billing.payments.filter((p) => p.status === 'PENDING') ?? [];
  const openOrders = account?.billing.orders.filter((o) => o.status !== 'DELIVERED') ?? [];

  const initials = account?.name
    ? account.name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <div>
      <Link to="/admin/merchants" className="text-sm font-semibold text-[var(--admin-brand)]">← Merchants</Link>
      {error ? (
        <p className="mt-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      {account ? (
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
          <div className="min-w-0">
            <PageHeader
              title={account.name}
              subtitle={
                <span className="flex flex-wrap items-center gap-2">
                  <span>{account.email}</span>
                  {account.emailVerified ? (
                    <span className="admin-pill-success rounded-full px-2 py-0.5 text-xs font-semibold">Email verified</span>
                  ) : (
                    <span className="rounded-full bg-[var(--admin-warn-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-warn)]">
                      Email not verified
                    </span>
                  )}
                  {!account.isActive ? (
                    <span className="rounded-full bg-[var(--admin-danger-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-danger)]">
                      Disabled
                    </span>
                  ) : null}
                  <span className="text-[var(--admin-muted)]">Joined {formatDate(account.createdAt)}</span>
                </span>
              }
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(account.email)}
                    className="admin-btn-secondary text-sm"
                  >
                    Copy email
                  </button>
                  {!account.isSuperAdmin ? (
                    <button
                      type="button"
                      disabled={Boolean(busy) || !account.isActive}
                      onClick={() => void openPanel()}
                      className="admin-btn-primary text-sm"
                    >
                      {busy === 'login' ? 'Opening…' : 'Open their panel ↗'}
                    </button>
                  ) : null}
                </>
              }
            />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-brand-soft)] text-lg font-bold text-[var(--admin-brand)]">
              {initials}
            </div>

            <div className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)]">
              {(
                [
                  ['overview', 'Overview'],
                  ['locations', `Locations (${locationCount})`],
                  ['billing', 'Billing'],
                  ['orders', `Orders (${account.billing.orders.length})`],
                  ['history', 'History'],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`px-3 py-2 text-sm font-semibold ${
                    tab === id ? 'border-b-2 border-[var(--admin-brand)] text-[var(--admin-brand)]' : 'text-[var(--admin-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(pendingPayments.length > 0 || openOrders.length > 0) && tab === 'overview' ? (
              <div className="admin-pill-warn mb-4 rounded-[var(--admin-radius-card)] p-4">
                <p className="text-sm font-semibold">Open items</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {pendingPayments.map((p) => (
                    <li key={p.id}>
                      Verify {formatINR(p.amountInr)} UPI —{' '}
                      <Link to="/admin/payments" className="font-semibold text-[var(--admin-brand)]">Review</Link>
                    </li>
                  ))}
                  {openOrders.map((o) => (
                    <li key={o.id}>
                      Fulfil {o.productName} —{' '}
                      <Link to="/admin/hardware-orders" className="font-semibold text-[var(--admin-brand)]">Orders</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tab === 'overview' ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Pays per month" value={formatINR(account.billing.monthlyPaidInr)} />
                <Stat label="Lifetime paid" value={formatINR(account.billing.lifetimePaidInr)} />
                <Stat label="Locations" value={String(locationCount)} />
                <Stat label="QR scans (30 d)" value="—" />
              </div>
            ) : null}

            {tab === 'locations' ? (
              <div className="space-y-3">
                {account.businesses.flatMap((business) =>
                  business.locations.map((location) => {
                    const subs = subsByLocation.get(location.id) ?? [];
                    const qr = account.billing.qrByLocation[location.id] ?? [];
                    return (
                      <article key={location.id} className="admin-card p-4">
                        <p className="font-semibold">{location.name}</p>
                        <p className="admin-meta text-sm">{location.address ?? business.name}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-[var(--admin-border-soft)] px-2 py-0.5 text-xs font-semibold">{location.status}</span>
                          {subs.map((sub) => (
                            <span key={sub.planName} className="rounded-full bg-[var(--admin-brand-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-brand)]">
                              {productDisplayName(sub.product)}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 font-mono-admin text-xs text-[var(--admin-muted)]">
                          Plans: {subs.length ? subs.map((s) => s.planName).join(', ') : '—'} · Standee:{' '}
                          {qr.map((c) => c.code).join(', ') || '—'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="admin-btn-primary text-sm"
                            onClick={() => {
                              setActivateLocationId(location.id);
                              setTab('overview');
                            }}
                          >
                            Activate plan
                          </button>
                          <Link to="/admin/qr" className="admin-btn-secondary text-sm">Assign standee</Link>
                        </div>
                      </article>
                    );
                  }),
                )}
              </div>
            ) : null}

            {tab === 'billing' ? (
              <ul className="space-y-2">
                {account.billing.payments.map((row) => (
                  <li key={row.id} className="admin-card px-3 py-2 text-sm">
                    <span className="font-semibold">{formatINR(row.amountInr)}</span>
                    <span className="text-[var(--admin-muted)]"> · {row.planName ?? '—'}</span>
                    <span className="block text-xs text-[var(--admin-muted)]">{row.status} · {formatDateTime(row.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === 'orders' ? (
              <ul className="space-y-2">
                {account.billing.orders.map((row) => (
                  <li key={row.id} className="admin-card px-3 py-2 text-sm">
                    <span className="font-semibold">{row.productName}</span>
                    <span className="text-[var(--admin-muted)]"> · {formatINR(row.amountInr)}</span>
                    <span className="block text-xs text-[var(--admin-muted)]">{row.status} · {formatDateTime(row.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === 'history' ? (
              account.history.length === 0 ? (
                <p className="admin-meta text-sm">No admin actions logged yet.</p>
              ) : (
                <ul className="space-y-2">
                  {account.history.map((row) => (
                    <li key={row.id} className="flex justify-between gap-3 text-sm">
                      <span>{row.summary}</span>
                      <span className="shrink-0 text-xs text-[var(--admin-muted)]">{formatDateTime(row.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>

          <aside className="mt-6 space-y-4 lg:mt-0">
            {activateLocation ? (
              <div className="admin-card p-4">
                <h3 className="admin-section-title">Activate plan</h3>
                <select
                  value={activateLocation.id}
                  onChange={(e) => setActivateLocationId(e.target.value)}
                  className="admin-ctl admin-ctl-form mt-2 w-full px-3 text-sm"
                >
                  {allLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <ActivatePlanForLocation
                  compact
                  locationId={activateLocation.id}
                  locationName={activateLocation.name}
                  onActivated={() => void reloadAccount().catch(() => undefined)}
                />
              </div>
            ) : null}
            {!isSelf ? (
              <div className="admin-card border-[var(--admin-danger-border)] p-4">
                <p className="font-semibold text-[var(--admin-danger)]">Danger zone</p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">Disabling stops public pages and QR for this merchant.</p>
                {account.isActive ? (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void patch({ isActive: false }, 'disable')}
                    className="admin-btn-danger-outline mt-3 w-full"
                  >
                    Disable account…
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void patch({ isActive: true }, 'enable')}
                    className="admin-btn-secondary mt-3 w-full"
                  >
                    Re-enable account
                  </button>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card p-4">
      <p className="admin-label uppercase">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

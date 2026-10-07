import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import type { PublicUser } from '../../lib/types';

type Desk = {
  counts: {
    pendingPayments: number;
    noPlanShops: number;
    ordersToShip: number;
    contactMessages: number;
  };
  pendingPayments: {
    id: string;
    amountInr: number;
    provider: string | null;
    locationName: string | null;
    userEmail: string | null;
  }[];
  noPlanShops: { id: string; name: string; businessName: string }[];
  ordersToShip: { id: string; status: string; businessNameSnapshot: string; locationName: string | null }[];
  contactMessages: { id: string; name: string; email: string; message: string }[];
};

type Overview = {
  counts: {
    users: number;
    unverified: number;
    disabled: number;
    businesses: number;
    locations: number;
    businessesWithoutLocations: number;
  };
  unverifiedUsers: PublicUser[];
  recentSignups: PublicUser[];
  businessesWithoutLocations: {
    id: string;
    name: string;
    createdAt: string;
    owner: { id: string; email: string; name: string } | null;
  }[];
  recentActions: { id: string; action: string; summary: string; createdAt: string }[];
  desk: Desk;
};

function when(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const overview = await api<Overview>('/api/admin/overview');
        if (!cancelled) setData(overview);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the desk');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const desk = data?.desk;

  const opsCards = desk
    ? [
        { label: 'Pending payments', value: desk.counts.pendingPayments, to: '/admin/subscriptions' },
        { label: 'No active plan', value: desk.counts.noPlanShops, to: '/admin/locations' },
        { label: 'Orders to ship', value: desk.counts.ordersToShip, to: '/admin/marketplace' },
        { label: 'Contact inbox', value: desk.counts.contactMessages, to: '/admin/contact' },
      ]
    : [];

  const cards = data
    ? [
        { label: 'Users', value: data.counts.users, to: '/admin/users' },
        { label: 'Unverified', value: data.counts.unverified, to: '/admin/users?status=unverified' },
        { label: 'Disabled', value: data.counts.disabled, to: '/admin/users?status=disabled' },
        { label: 'Locations', value: data.counts.locations, to: '/admin/locations' },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Desk</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Pending payments, shops without a plan, marketplace shipments, and contact messages — then accounts and
        locations.
      </p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}
      {data && desk ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {opsCards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="rounded-2xl border border-brand/30 bg-brand/5 p-5 hover:border-brand/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <QueueSection
              title="Pending payments"
              to="/admin/subscriptions"
              empty="All caught up."
              hasItems={desk.pendingPayments.length > 0}
            >
              {desk.pendingPayments.map((row) => (
                <li key={row.id}>
                  <span className="font-semibold">₹{row.amountInr}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {row.locationName ?? '—'} · {row.userEmail ?? '—'}
                  </span>
                </li>
              ))}
            </QueueSection>
            <QueueSection
              title="No plan"
              to="/admin/locations"
              empty="Every location has live access."
              hasItems={desk.noPlanShops.length > 0}
            >
              {desk.noPlanShops.map((row) => (
                <li key={row.id}>
                  <span className="font-semibold">{row.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{row.businessName}</span>
                </li>
              ))}
            </QueueSection>
            <QueueSection
              title="Orders to ship"
              to="/admin/marketplace"
              empty="No open hardware orders."
              hasItems={desk.ordersToShip.length > 0}
            >
              {desk.ordersToShip.map((row) => (
                <li key={row.id}>
                  <span className="font-semibold">{row.businessNameSnapshot}</span>
                  <span className="mt-0.5 block text-sm text-muted">{row.status} · {row.locationName ?? '—'}</span>
                </li>
              ))}
            </QueueSection>
            <QueueSection
              title="Contact"
              to="/admin/contact"
              empty="Inbox clear."
              hasItems={desk.contactMessages.length > 0}
            >
              {desk.contactMessages.map((row) => (
                <li key={row.id}>
                  <span className="font-semibold">{row.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{row.message}</span>
                </li>
              ))}
            </QueueSection>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link key={card.label} to={card.to} className="rounded-2xl border border-line bg-white p-5 hover:border-brand/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">Waiting on email</h2>
                <Link to="/admin/users?status=unverified" className="text-sm font-semibold text-brand">
                  All
                </Link>
              </div>
              {data.unverifiedUsers.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No unverified accounts.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.unverifiedUsers.map((person) => (
                    <li key={person.id}>
                      <Link to={`/admin/users/${person.id}`} className="block hover:text-brand">
                        <span className="font-semibold">{person.name}</span>
                        <span className="mt-0.5 block text-sm text-muted">{person.email}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-bold">Shops with no location</h2>
              <p className="mt-1 text-sm text-muted">{data.counts.businessesWithoutLocations} total</p>
              {data.businessesWithoutLocations.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Every business has a location.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.businessesWithoutLocations.map((business) => (
                    <li key={business.id}>
                      <p className="font-semibold">{business.name}</p>
                      <p className="text-sm text-muted">{business.owner?.email ?? 'No owner'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-bold">Recent signups</h2>
              <ul className="mt-4 space-y-3">
                {data.recentSignups.map((person) => (
                  <li key={person.id} className="flex items-start justify-between gap-3">
                    <Link to={`/admin/users/${person.id}`} className="min-w-0 hover:text-brand">
                      <span className="block truncate font-semibold">{person.name}</span>
                      <span className="block truncate text-sm text-muted">{person.email}</span>
                    </Link>
                    <span className="shrink-0 text-xs text-muted">{when(person.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-bold">Recent actions</h2>
              {data.recentActions.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Nothing logged yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.recentActions.map((event) => (
                    <li key={event.id} className="flex items-start justify-between gap-3">
                      <p className="text-sm">{event.summary}</p>
                      <span className="shrink-0 text-xs text-muted">{when(event.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function QueueSection({
  title,
  to,
  empty,
  hasItems,
  children,
}: {
  title: string;
  to: string;
  empty: string;
  hasItems: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        <Link to={to} className="text-sm font-semibold text-brand">Open</Link>
      </div>
      {!hasItems ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">{children}</ul>
      )}
    </section>
  );
}

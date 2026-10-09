import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { adminWhen, inr } from '../../lib/admin-ui';
type WorkItem = {
  id: string;
  kind: 'PAYMENT' | 'ORDER' | 'SUPPORT' | 'ACCOUNT';
  title: string;
  detail: string;
  createdAt: string;
  href: string;
  actionLabel: string;
};

type Overview = {
  health: {
    mrrInr: number;
    payingLocations: number;
    merchantsTotal: number;
    trialsRunning: number;
    trialsEndingIn3Days: number;
    trialsEndingSoon: {
      locationId: string;
      locationName: string;
      planName: string;
      endDate: string;
    }[];
  };
  navCounts: { desk: number };
  desk: { workQueue: WorkItem[] };
  recentActions: { id: string; summary: string; createdAt: string }[];
};

const KIND_LABEL: Record<WorkItem['kind'], string> = {
  PAYMENT: 'Payment',
  ORDER: 'Order',
  SUPPORT: 'Support',
  ACCOUNT: 'Account',
};

export function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | WorkItem['kind']>('all');

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

  const queue = data?.desk.workQueue ?? [];
  const filtered = filter === 'all' ? queue : queue.filter((row) => row.kind === filter);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Desk</h1>
      <p className="mt-1 text-sm text-muted">What needs you today — then revenue health and recent admin actions.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}
      {data ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HealthCard
              label="Monthly recurring revenue"
              value={inr(data.health.mrrInr)}
              hint="from paid plans"
            />
            <HealthCard
              label="Paying locations"
              value={`${data.health.payingLocations}`}
              hint={`${data.health.merchantsTotal} merchants total`}
            />
            <HealthCard
              label="Trials running"
              value={`${data.health.trialsRunning}`}
              hint={
                data.health.trialsEndingIn3Days > 0
                  ? `${data.health.trialsEndingIn3Days} end in 3 days`
                  : 'none ending soon'
              }
            />
            <HealthCard label="Needs you" value={`${data.navCounts.desk}`} hint="open queue items" />
          </div>

          <section className="mt-6 rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">Work queue</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {(['all', 'PAYMENT', 'ORDER', 'SUPPORT', 'ACCOUNT'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      filter === key ? 'bg-ink text-white' : 'bg-paper text-muted ring-1 ring-line'
                    }`}
                  >
                    {key === 'all' ? 'All' : KIND_LABEL[key]}
                  </button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <p className="mt-4 text-sm text-muted">When this list is empty you&apos;re done for the day.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {filtered.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">{KIND_LABEL[row.kind]}</p>
                      <p className="mt-0.5 font-semibold">{row.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{row.detail}</p>
                      <p className="mt-1 text-xs text-muted">{adminWhen(row.createdAt)}</p>
                    </div>
                    <Link
                      to={row.href}
                      className="min-h-10 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                      {row.actionLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-bold">Trials ending this week</h2>
              {data.health.trialsEndingSoon.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No trials ending in the next 3 days.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.health.trialsEndingSoon.map((row) => (
                    <li key={`${row.locationId}-${row.planName}`}>
                      <p className="font-semibold">{row.locationName}</p>
                      <p className="text-sm text-muted">{row.planName} · ends {row.endDate}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">Activity log</h2>
                <Link to="/admin/activity" className="text-sm font-semibold text-brand">All</Link>
              </div>
              {data.recentActions.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Nothing logged yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.recentActions.map((event) => (
                    <li key={event.id} className="flex items-start justify-between gap-3">
                      <p className="text-sm">{event.summary}</p>
                      <span className="shrink-0 text-xs text-muted">{adminWhen(event.createdAt)}</span>
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

function HealthCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );
}

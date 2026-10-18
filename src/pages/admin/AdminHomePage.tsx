import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { api, ApiError } from '../../lib/api';
import { productDisplayName } from '../../lib/admin-products';
import {
  formatDate,
  formatDateTime,
  formatINR,
  pluralize,
  relativeAge,
} from '../../lib/admin-ui';

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
  counts?: { locations: number };
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
      product?: string;
      endDate: string;
    }[];
  };
  desk: {
    workQueue: WorkItem[];
    pendingPayments?: { id: string; amountInr: number; createdAt: string }[];
  };
  recentActions: { id: string; summary: string; createdAt: string; action?: string }[];
};

type QueueFilter = 'all' | 'PAYMENT' | 'ORDER' | 'TRIAL' | 'SUPPORT';

const KIND_LABEL: Record<WorkItem['kind'], string> = {
  PAYMENT: 'Payment',
  ORDER: 'Order',
  SUPPORT: 'Support',
  ACCOUNT: 'Account',
};

const KIND_PILL: Record<WorkItem['kind'], string> = {
  PAYMENT: 'bg-[var(--admin-brand-soft)] text-[var(--admin-brand)]',
  ORDER: 'bg-[#f4f3ff] text-[#5925dc]',
  SUPPORT: 'bg-[var(--admin-warn-soft)] text-[var(--admin-warn)]',
  ACCOUNT: 'bg-[var(--admin-border-soft)] text-[var(--admin-muted)]',
};

function weekdayDateLine(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [hidePanelOpens, setHidePanelOpens] = useState(true);

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
  const deskCount = queue.length;

  const pendingVerify = data?.desk.pendingPayments ?? [];
  const awaitingSum = pendingVerify.reduce((n, p) => n + p.amountInr, 0);
  const oldestPending = pendingVerify.length
    ? pendingVerify.reduce((a, b) => (a.createdAt < b.createdAt ? a : b))
    : null;
  const oldestHours = oldestPending
    ? (Date.now() - new Date(oldestPending.createdAt).getTime()) / (60 * 60 * 1000)
    : 0;

  const trialsByLocation = useMemo(() => {
    const map = new Map<
      string,
      { locationName: string; items: Overview['health']['trialsEndingSoon'] }
    >();
    for (const row of data?.health.trialsEndingSoon ?? []) {
      const bucket = map.get(row.locationId) ?? { locationName: row.locationName, items: [] };
      bucket.items.push(row);
      map.set(row.locationId, bucket);
    }
    return [...map.values()];
  }, [data?.health.trialsEndingSoon]);

  const filtered = useMemo(() => {
    if (filter === 'all') return queue;
    if (filter === 'TRIAL') return [];
    return queue.filter((row) => row.kind === filter);
  }, [filter, queue]);

  const trialsEndingToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (data?.health.trialsEndingSoon ?? []).filter((t) => t.endDate === today);
  }, [data?.health.trialsEndingSoon]);

  const visibleActions = useMemo(() => {
    const rows = data?.recentActions ?? [];
    const filteredRows = hidePanelOpens
      ? rows.filter((r) => !/opened panel/i.test(r.summary))
      : rows;
    return { rows: filteredRows.slice(0, 8), hidden: rows.length - filteredRows.length };
  }, [data?.recentActions, hidePanelOpens]);

  const locationTotal = data?.counts?.locations ?? data?.health.merchantsTotal ?? 0;

  return (
    <div>
      <PageHeader
        title="Desk"
        subtitle={
          data
            ? `${weekdayDateLine()} · ${pluralize(deskCount, 'thing')} need you`
            : weekdayDateLine()
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/payments?action=grant" className="admin-btn-secondary text-sm">
              Grant free access
            </Link>
            <Link to="/admin/payments?action=manual" className="admin-btn-secondary text-sm">
              Record UPI / cash
            </Link>
          </div>
        }
      />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      {!data && !error ? <p className="admin-meta">Loading…</p> : null}
      {data ? (
        <>
          {trialsEndingToday.length > 0 ? (
            <div className="admin-pill-warn mb-6 rounded-[var(--admin-radius-card)] px-4 py-3">
              <p className="text-sm font-semibold">
                {pluralize(trialsEndingToday.length, 'trial')} end today at{' '}
                {trialsEndingToday[0]?.locationName}
                {trialsEndingToday.length > 1 ? ` (+${trialsEndingToday.length - 1} more)` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link to={`/admin/merchants`} className="admin-btn-secondary text-xs">
                  Extend 7 days
                </Link>
                <Link
                  to={`/admin/merchants`}
                  className="admin-btn-secondary text-xs"
                >
                  Open merchant
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Monthly recurring revenue" value={formatINR(data.health.mrrInr)} hint="from paid plans" />
            <KpiCard
              label="Paying locations"
              value={`${data.health.payingLocations} / ${locationTotal}`}
              hint={`${pluralize(data.health.merchantsTotal, 'merchant')} on platform`}
            />
            <KpiCard
              label="Trials running"
              value={String(data.health.trialsRunning)}
              hint={
                data.health.trialsEndingSoon.length
                  ? trialsEndingHint(data.health.trialsEndingSoon)
                  : 'none ending soon'
              }
            />
            <KpiCard
              label="Awaiting verification"
              value={formatINR(awaitingSum)}
              hint={
                oldestPending
                  ? `oldest ${relativeAge(oldestPending.createdAt)}`
                  : 'no pending UPI/cash'
              }
              danger={oldestHours > 48}
            />
          </div>

          <section className="admin-card mt-6 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="admin-section-title">Work queue</h2>
              <Segmented
                value={filter}
                onChange={setFilter}
                options={[
                  ['all', 'All'],
                  ['PAYMENT', 'Payment'],
                  ['ORDER', 'Order'],
                  ['TRIAL', 'Trial'],
                  ['SUPPORT', 'Support'],
                ]}
              />
            </div>
            {filter === 'TRIAL' ? (
              trialsByLocation.length === 0 ? (
                <p className="admin-meta mt-4">No trials ending soon.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {trialsByLocation.map((group) => (
                    <li key={group.items[0]?.locationId} className="rounded-[var(--admin-radius-ctl)] border border-[var(--admin-border)] p-3">
                      <p className="font-semibold">{group.locationName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {group.items.map((t) => (
                          <span
                            key={`${t.planName}-${t.endDate}`}
                            className="rounded-full bg-[var(--admin-border-soft)] px-2 py-0.5 text-xs font-semibold"
                          >
                            {t.product ? productDisplayName(t.product) : t.planName}
                          </span>
                        ))}
                      </div>
                      <p className="admin-meta mt-1">Ends {formatDate(group.items[0]?.endDate ?? '')}</p>
                    </li>
                  ))}
                </ul>
              )
            ) : filtered.length === 0 ? (
              <p className="admin-meta mt-4">When this list is empty you&apos;re done for the day.</p>
            ) : (
              <div className="admin-table-scroll mt-4">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Item</th>
                      <th className="py-2 pr-3">Waiting</th>
                      <th className="py-2 w-[120px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const age = relativeAge(row.createdAt);
                      const stale = (Date.now() - new Date(row.createdAt).getTime()) / (60 * 60 * 1000) > 48;
                      return (
                        <tr key={row.id} className="border-b border-[var(--admin-border-soft)]">
                          <td className="py-3 pr-3 align-middle">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${KIND_PILL[row.kind]}`}>
                              {KIND_LABEL[row.kind]}
                            </span>
                          </td>
                          <td className="py-3 pr-3 align-middle">
                            <p className="font-semibold text-[var(--admin-text)]">{row.title}</p>
                            <p className="admin-meta text-xs">{row.detail}</p>
                          </td>
                          <td className={`py-3 pr-3 align-middle text-sm font-medium ${stale ? 'text-[var(--admin-danger)]' : 'text-[var(--admin-muted)]'}`}>
                            {age}
                          </td>
                          <td className="py-3 align-middle">
                            <Link
                              to={row.href}
                              className="admin-btn-primary inline-flex w-[120px] text-center text-sm"
                            >
                              {row.actionLabel}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="admin-card p-5">
              <h2 className="admin-section-title">Trials ending this week</h2>
              {trialsByLocation.length === 0 ? (
                <p className="admin-meta mt-4">No trials ending in the next few days.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {trialsByLocation.map((group) => (
                    <li key={group.items[0]?.locationId} className="rounded-[var(--admin-radius-ctl)] border border-[var(--admin-border)] p-3">
                      <p className="font-semibold">{group.locationName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {group.items.map((t) => (
                          <span key={t.planName} className="rounded-full bg-[var(--admin-brand-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-brand)]">
                            {t.product ? productDisplayName(t.product) : t.planName}
                          </span>
                        ))}
                      </div>
                      <p className="admin-meta mt-1">Ends {formatDate(group.items[0]?.endDate ?? '')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" className="admin-btn-secondary text-xs">Extend all</button>
                        <button type="button" className="admin-btn-secondary text-xs">Send payment link</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="admin-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="admin-section-title">Recent admin actions</h2>
                <Link to="/admin/activity" className="text-sm font-semibold text-[var(--admin-brand)]">All</Link>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-[var(--admin-muted)]">
                <input
                  type="checkbox"
                  checked={hidePanelOpens}
                  onChange={(e) => setHidePanelOpens(e.target.checked)}
                />
                Hide &apos;opened panel&apos; events
              </label>
              {visibleActions.rows.length === 0 ? (
                <p className="admin-meta mt-4">Nothing logged yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {visibleActions.rows.map((event) => (
                    <li key={event.id} className="flex items-start justify-between gap-3">
                      <p className="text-sm text-[var(--admin-text-2)]">{event.summary}</p>
                      <span className="shrink-0 text-xs text-[var(--admin-muted)]">{formatDateTime(event.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {hidePanelOpens && visibleActions.hidden > 0 ? (
                <p className="admin-meta mt-3 text-xs">+{visibleActions.hidden} panel opens hidden</p>
              ) : null}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function trialsEndingHint(
  rows: { endDate: string }[],
): string {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter((r) => r.endDate === today).length;
  if (todayCount) return `${todayCount} end today`;
  const soonest = rows.reduce((a, b) => (a.endDate < b.endDate ? a : b));
  const days = Math.max(
    0,
    Math.ceil((new Date(soonest.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  if (days === 0) return 'ends today';
  return `ends in ${days} days`;
}

function KpiCard({
  label,
  value,
  hint,
  danger,
}: {
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div className="admin-card p-5">
      <p className="admin-label uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--admin-text)]">{value}</p>
      <p className={`mt-1 text-sm ${danger ? 'font-semibold text-[var(--admin-danger)]' : 'text-[var(--admin-muted)]'}`}>
        {hint}
      </p>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-border-soft)] p-1">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded-md px-3 py-1 text-xs font-semibold ${
            value === id
              ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm'
              : 'text-[var(--admin-muted)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

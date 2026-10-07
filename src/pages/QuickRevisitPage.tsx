import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, Repeat, Search, Users } from 'lucide-react';
import { LockedQrGate } from '../components/LockedQrGate';
import { PageHeader } from '../components/PageHeader';
import { QrProductCard } from '../components/QrProductCard';
import { api, ApiError } from '../lib/api';
import { productStatusLabel } from '../lib/location-workspace';
import { useLocationContext } from '../lib/location-context';

type Tab = 'overview' | 'customers' | 'settings' | 'rewards';

type Summary = {
  publicUrl: string;
  publicPath: string;
  revisitUnlocked: boolean;
  revisitAccess: { status: string; unlocked: boolean };
  settings: {
    enabled: boolean;
    visitFrequency: string;
    visitFrequencyHours: number;
    loyaltyScope: string;
    customerNameMode: string;
    otpEnabled: boolean;
  };
  stats: {
    totalCustomers: number;
    totalVisits: number;
    returningCustomers: number;
    newCustomers: number;
    visitsToday: number;
    visitsThisWeek: number;
    visitsThisMonth: number;
  };
};

type CustomerRow = {
  id: string;
  name: string | null;
  mobile: string;
  totalVisits: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  currentReward: string | null;
  rewardStatus: string | null;
};

type RewardRow = {
  id?: string;
  name: string;
  description?: string | null;
  visitThreshold: number;
  rewardType?: string;
  rewardValue?: string | null;
  active?: boolean;
};

type CustomerDetail = {
  id: string;
  name: string | null;
  mobile: string;
  totalVisits: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  progress: Summary['stats'] | Record<string, unknown>;
  rewardsUnlocked: {
    id: string;
    name: string;
    rewardCode: string;
    status: string;
    unlockedAt: string;
  }[];
  visits: { id: string; visitedAt: string; visitNumber: number }[];
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'customers', label: 'Customers' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'settings', label: 'Settings' },
];

function formatWhen(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function QuickRevisitPage() {
  const { selected } = useLocationContext();
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadHub() {
    if (!selected) return;
    const hub = await api<Summary>(`/api/locations/${selected.id}/quickrevisit`);
    const settingsBundle = await api<{ rewards: RewardRow[] }>(
      `/api/locations/${selected.id}/quickrevisit/settings`,
    );
    setSummary(hub);
    setRewards(settingsBundle.rewards.length ? settingsBundle.rewards : [{ name: '', visitThreshold: 3 }]);
  }

  useEffect(() => {
    if (!selected) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await loadHub();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load Quick Revisit');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || tab !== 'customers') return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await api<CustomerRow[]>(
          `/api/locations/${selected.id}/quickrevisit/customers?search=${encodeURIComponent(search)}`,
        );
        if (!cancelled) setCustomers(rows);
      } catch {
        if (!cancelled) setCustomers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id, tab, search]);

  async function saveSettings(patch: Partial<Summary['settings']>) {
    if (!selected || !summary) return;
    const { settings } = await api<{ settings: Summary['settings'] }>(
      `/api/locations/${selected.id}/quickrevisit/settings`,
      { method: 'PATCH', body: patch },
    );
    setSummary({ ...summary, settings });
    setMsg('Settings saved');
  }

  async function saveRewards() {
    if (!selected) return;
    const cleaned = rewards
      .filter((r) => r.name.trim() && r.visitThreshold > 0)
      .map((r) => ({
        id: r.id,
        name: r.name.trim(),
        description: r.description?.trim() || undefined,
        visitThreshold: r.visitThreshold,
        rewardValue: r.rewardValue?.trim() || undefined,
        active: true,
      }));
    const result = await api<{ rewards: RewardRow[] }>(
      `/api/locations/${selected.id}/quickrevisit/rewards`,
      { method: 'PATCH', body: { rewards: cleaned } },
    );
    setRewards(result.rewards);
    setMsg('Rewards updated');
  }

  async function openCustomer(id: string) {
    if (!selected) return;
    const data = await api<CustomerDetail>(
      `/api/locations/${selected.id}/quickrevisit/customers/${id}`,
    );
    setDetail(data);
  }

  if (!selected) {
    return (
      <div>
        <PageHeader icon={Repeat} title="Quick Revisit" description="Customer loyalty without login." />
        <p className="mt-6 text-sm text-muted">Select a location to manage Quick Revisit.</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <PageHeader icon={Repeat} title="Quick Revisit" description="Loading…" />
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  const locked = !summary.revisitUnlocked;

  return (
    <div>
      <PageHeader
        icon={Repeat}
        title="Quick Revisit"
        description="Guests scan your QR, enter a mobile number, and see their visit count — no app or password."
      />

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {msg ? (
        <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800" onAnimationEnd={() => setMsg(null)}>
          {msg}
        </p>
      ) : null}

      {locked ? (
        <div className="mt-6">
          <LockedQrGate unlockLabel="Activate QuickCommerce to unlock Quick Revisit" />
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-1 border-b border-line pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setDetail(null);
              }}
              className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
                tab === t.id ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {!locked && !summary.settings.enabled ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            Quick Commerce is active, but the guest loyalty page is still <strong>off</strong>. Open{' '}
            <button
              type="button"
              className="font-semibold text-brand underline"
              onClick={() => setTab('settings')}
            >
              Settings
            </button>{' '}
            and turn on <strong>Enable Quick Revisit</strong>.
          </p>
        </div>
      ) : null}

      {!locked && tab === 'overview' ? (
        <div className="mt-8 space-y-8">
          <QrProductCard
            title="Quick Revisit"
            purpose="Same QR as Quick Commerce — catalogue + loyalty"
            publicUrl={summary.publicUrl}
            publicPath={summary.publicPath}
            unlocked={summary.settings.enabled}
            statusLabel={
              summary.settings.enabled
                ? productStatusLabel(true, summary.revisitAccess.status)
                : 'Off — enable in Settings'
            }
            unlockLabel="Turn on in Settings"
            onUnlockClick={summary.settings.enabled ? undefined : () => setTab('settings')}
            manageHref="/app/quickcommerce/revisit"
            manageLabel="Quick Revisit"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Total customers', summary.stats.totalCustomers],
              ['Total visits', summary.stats.totalVisits],
              ['Visits today', summary.stats.visitsToday],
              ['Returning', summary.stats.returningCustomers],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="font-bold">Share link</p>
            <p className="mt-1 text-sm text-muted">Point a standee QR to Quick Revisit in QR codes, or share this link.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <code className="flex-1 rounded-xl bg-paper px-3 py-2 text-xs">{summary.publicUrl}</code>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                onClick={() => {
                  void navigator.clipboard.writeText(summary.publicUrl);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </button>
              <a
                href={summary.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Preview
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {!locked && tab === 'customers' ? (
        <div className="mt-8">
          {detail ? (
            <div className="space-y-6">
              <button type="button" className="text-sm font-semibold text-brand" onClick={() => setDetail(null)}>
                ← Back to list
              </button>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-xl font-bold">{detail.name || 'Guest'}</h2>
                <p className="text-sm text-muted">{detail.mobile}</p>
                <p className="mt-4 text-4xl font-black text-brand">{detail.totalVisits} visits</p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.visits.map((v) => (
                      <tr key={v.id} className="border-b border-line/60">
                        <td className="px-4 py-3">{formatWhen(v.visitedAt)}</td>
                        <td className="px-4 py-3 font-semibold">Visit #{v.visitNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="w-full rounded-xl border border-line py-2.5 pl-10 pr-3 text-sm"
                  placeholder="Search mobile or name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-line bg-paper text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Visits</th>
                      <th className="px-4 py-3">Last visit</th>
                      <th className="px-4 py-3">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="cursor-pointer border-b border-line/60 hover:bg-paper/80"
                        onClick={() => void openCustomer(c.id)}
                      >
                        <td className="px-4 py-3 font-medium">{c.name || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{c.mobile}</td>
                        <td className="px-4 py-3">{c.totalVisits}</td>
                        <td className="px-4 py-3">{formatWhen(c.lastVisitAt)}</td>
                        <td className="px-4 py-3">{c.currentReward || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!customers.length ? (
                  <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted">
                    <Users className="h-4 w-4" />
                    No customers yet — share your Quick Revisit QR.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}

      {!locked && tab === 'rewards' ? (
        <div className="mt-8 max-w-xl space-y-4">
          {rewards.map((row, i) => (
            <div key={row.id ?? i} className="rounded-2xl border border-line bg-white p-4 space-y-3">
              <input
                className="w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                placeholder="Reward name (e.g. Free Coffee)"
                value={row.name}
                onChange={(e) =>
                  setRewards((list) => list.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                }
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-28 rounded-xl border border-line px-3 py-2 text-sm"
                  value={row.visitThreshold}
                  onChange={(e) =>
                    setRewards((list) =>
                      list.map((r, j) =>
                        j === i ? { ...r, visitThreshold: Number(e.target.value) } : r,
                      ),
                    )
                  }
                />
                <span className="self-center text-sm text-muted">visits →</span>
                <input
                  className="flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                  placeholder="e.g. 10% OFF"
                  value={row.rewardValue ?? ''}
                  onChange={(e) =>
                    setRewards((list) =>
                      list.map((r, j) => (j === i ? { ...r, rewardValue: e.target.value } : r)),
                    )
                  }
                />
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-line px-4 py-2 text-sm font-semibold"
              onClick={() => setRewards((r) => [...r, { name: '', visitThreshold: 5 }])}
            >
              Add milestone
            </button>
            <button
              type="button"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void saveRewards().catch(() => setError('Could not save rewards'))}
            >
              Save rewards
            </button>
          </div>
        </div>
      ) : null}

      {!locked && tab === 'settings' ? (
        <div className="mt-8 max-w-lg space-y-6 rounded-2xl border border-line bg-white p-5">
          <label className="flex items-center justify-between gap-4">
            <span className="font-semibold">Enable Quick Revisit</span>
            <input
              type="checkbox"
              checked={summary.settings.enabled}
              onChange={(e) => void saveSettings({ enabled: e.target.checked })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Visit frequency</span>
            <select
              className="mt-2 w-full rounded-xl border border-line px-3 py-2"
              value={summary.settings.visitFrequency}
              onChange={(e) => void saveSettings({ visitFrequency: e.target.value })}
            >
              <option value="once_per_day">Once per day</option>
              <option value="every_x_hours">Once every X hours</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </label>
          {summary.settings.visitFrequency === 'every_x_hours' ? (
            <label className="block text-sm">
              <span className="font-semibold">Hours between visits</span>
              <input
                type="number"
                min={1}
                max={168}
                className="mt-2 w-full rounded-xl border border-line px-3 py-2"
                value={summary.settings.visitFrequencyHours}
                onChange={(e) =>
                  void saveSettings({ visitFrequencyHours: Number(e.target.value) })
                }
              />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="font-semibold">Loyalty scope</span>
            <select
              className="mt-2 w-full rounded-xl border border-line px-3 py-2"
              value={summary.settings.loyaltyScope}
              onChange={(e) => void saveSettings({ loyaltyScope: e.target.value })}
            >
              <option value="business_wide">All locations (business-wide)</option>
              <option value="per_location">This location only</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Customer name</span>
            <select
              className="mt-2 w-full rounded-xl border border-line px-3 py-2"
              value={summary.settings.customerNameMode}
              onChange={(e) => void saveSettings({ customerNameMode: e.target.value })}
            >
              <option value="optional">Optional</option>
              <option value="required">Required</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold">OTP verification (coming soon)</span>
            <input type="checkbox" checked={summary.settings.otpEnabled} disabled />
          </label>
          <p className="text-xs text-muted">
            Link a physical QR under{' '}
            <Link to="/app/qr" className="font-semibold text-brand">
              QR codes
            </Link>{' '}
            and choose &quot;Revisit QR&quot;.
          </p>
        </div>
      ) : null}
    </div>
  );
}

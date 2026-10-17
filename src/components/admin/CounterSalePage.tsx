import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  KeyRound,
  LogIn,
  Link2,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  UserPlus,
} from 'lucide-react';

export type Service = 'quickreview' | 'quickcommerce';

export interface Agent {
  id: string;
  username: string;
  status: 'active' | 'disabled';
}

export interface GooglePlace {
  placeId: string;
  name: string;
  address: string;
}

export interface ProvisionedLocation {
  id: string;
  businessId: string;
  businessName: string;
  address?: string;
  qrCode: string;
  service: Service;
  agentUsername: string | null;
  linkedAt: string;
  onHoldingAccount: boolean;
}

export interface CounterSalePageProps {
  agents: Agent[];
  locations: ProvisionedLocation[];
  agentAppUrl: string;
  onAddAgent: (username: string, pin: string) => Promise<void>;
  onToggleAgent: (agentId: string, nextStatus: Agent['status']) => Promise<void>;
  onLoginAsAgent: (agentId: string) => Promise<void>;
  onChangeAgentPin: (agentId: string, pin: string) => Promise<void>;
  onSearchPlaces: (query: string) => Promise<GooglePlace[]>;
  onLinkStandee: (input: { qrCode: string; service: Service; placeId: string }) => Promise<void>;
  onTransferShop?: (input: { businessId: string; email: string }) => Promise<void>;
  onScanQr?: () => Promise<string | null>;
}

const SERVICE_LABEL: Record<Service, string> = {
  quickreview: 'QuickReview',
  quickcommerce: 'QuickCommerce',
};

export function parseQrInput(raw: string): string {
  const v = raw.trim();
  const m = v.match(/\/q\/([A-Za-z0-9]+)/);
  return (m ? m[1] : v).toUpperCase();
}

const randomPin = () => String(Math.floor(100 + Math.random() * 900));

const inputCls =
  'h-11 w-full rounded-[10px] border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20';

const iconBtnCls =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

export function CounterSalePage(props: CounterSalePageProps) {
  const activeAgents = props.agents.filter((a) => a.status === 'active').length;

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-0 py-2 font-sans text-slate-900 md:px-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-slate-500">
            <Link to="/admin/merchants" className="hover:text-slate-900 hover:underline">
              Merchants
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-900">Counter sale</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">Counter sale</h1>
          <p className="max-w-[620px] text-[15px] leading-relaxed text-slate-600">
            Manage field agents who sell standees on site through the counter-sale app, or link a standee to a
            merchant&apos;s Google profile yourself.
          </p>
        </div>
        <a
          href={props.agentAppUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
        >
          <ExternalLink size={16} aria-hidden="true" />
          Open agent app
        </a>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Active agents" value={activeAgents} />
        <StatTile label="Standees linked" value={props.locations.length} />
        <StatTile
          label="Provisioned locations"
          value={new Set(props.locations.map((l) => l.businessName)).size}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <LinkStandeeCard {...props} />
        <AgentsCard {...props} />
      </div>

      <LocationsCard locations={props.locations} onTransferShop={props.onTransferShop} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-slate-200 bg-white px-5 py-[18px]">
      <span className="text-[13px] font-medium text-slate-500">{label}</span>
      <span className="text-[28px] font-bold tracking-tight">{value}</span>
    </div>
  );
}

function CardHeader({ icon, title, desc, id }: { icon: ReactNode; title: string; desc: string; id: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-indigo-50 text-blue-700">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {n}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function LinkStandeeCard({ onSearchPlaces, onLinkStandee, onScanQr }: CounterSalePageProps) {
  const [qrRaw, setQrRaw] = useState('');
  const [service, setService] = useState<Service>('quickreview');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [place, setPlace] = useState<GooglePlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qrCode = parseQrInput(qrRaw);
  const canLink = qrCode.length >= 4 && !!place && !linking;

  async function search(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await onSearchPlaces(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t search Google places. Try again.');
    } finally {
      setSearching(false);
    }
  }

  async function link() {
    if (!place) return;
    setLinking(true);
    setError(null);
    try {
      await onLinkStandee({ qrCode, service, placeId: place.placeId });
      setQrRaw('');
      setQuery('');
      setResults([]);
      setPlace(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Linking failed.');
    } finally {
      setLinking(false);
    }
  }

  return (
    <section
      id="link-standee"
      aria-labelledby="link-h"
      className="flex flex-col gap-[22px] rounded-2xl border border-slate-200 bg-white p-6"
    >
      <CardHeader
        id="link-h"
        icon={<Link2 size={20} aria-hidden="true" />}
        title="Link a standee"
        desc="Connect a printed QR to a business’s Google profile without an agent on site."
      />

      <Step n={1}>
        <label htmlFor="qr" className="text-sm font-semibold">
          QR code
        </label>
        <div className="flex gap-2">
          <input
            id="qr"
            value={qrRaw}
            onChange={(e) => setQrRaw(e.target.value)}
            placeholder="AB12CD34 or paste a /q/ link"
            className={`${inputCls} font-mono uppercase`}
          />
          {onScanQr ? (
            <button
              type="button"
              aria-label="Scan QR with camera"
              className={iconBtnCls}
              onClick={async () => {
                const c = await onScanQr();
                if (c) setQrRaw(c);
              }}
            >
              <ScanLine size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <span className="text-xs text-slate-500">The 8-character code printed under the QR.</span>
      </Step>

      <Step n={2}>
        <span id="svc-l" className="text-sm font-semibold">
          Service
        </span>
        <div role="radiogroup" aria-labelledby="svc-l" className="grid grid-cols-2 gap-2">
          {(['quickreview', 'quickcommerce'] as Service[]).map((s) => {
            const on = service === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setService(s)}
                className={`flex min-h-16 flex-col justify-center gap-0.5 rounded-xl px-3.5 py-2.5 text-left ${
                  on ? 'border-2 border-blue-700 bg-blue-50/60' : 'border border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-semibold">{SERVICE_LABEL[s]}</span>
                <span className="text-xs text-slate-500">
                  {s === 'quickreview' ? 'Google reviews' : 'Ordering & catalogue'}
                </span>
              </button>
            );
          })}
        </div>
      </Step>

      <Step n={3}>
        <label htmlFor="place" className="text-sm font-semibold">
          Google business
        </label>
        <form onSubmit={search} className="relative flex items-center">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-slate-500" />
          <input
            id="place"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPlace(null);
            }}
            placeholder="Search by business name and area"
            className={`${inputCls} pl-[42px]`}
          />
        </form>
        {searching ? <span className="text-xs text-slate-500">Searching…</span> : null}
        {results.length > 0 && !place ? (
          <ul className="flex flex-col overflow-hidden rounded-[10px] border border-slate-200">
            {results.map((r) => (
              <li key={r.placeId}>
                <button
                  type="button"
                  onClick={() => setPlace(r)}
                  className="flex w-full flex-col gap-0.5 border-b border-slate-100 px-3.5 py-2.5 text-left last:border-0 hover:bg-slate-50"
                >
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span className="text-xs text-slate-500">{r.address}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {place ? (
          <div className="flex items-center justify-between gap-3 rounded-[10px] border-2 border-blue-700 bg-blue-50/60 px-3.5 py-2.5">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{place.name}</span>
              <span className="truncate text-xs text-slate-500">{place.address}</span>
            </div>
            <button type="button" onClick={() => setPlace(null)} className="text-sm font-semibold text-blue-700">
              Change
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Press Enter, then pick a result to confirm the listing.</span>
        )}
      </Step>

      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-[18px]">
        <span className="text-[13px] text-slate-500">
          {canLink
            ? `Link ${qrCode} to ${place!.name} on ${SERVICE_LABEL[service]}.`
            : 'Enter a QR code and choose a business to continue.'}
        </span>
        <button
          type="button"
          disabled={!canLink}
          onClick={() => void link()}
          className="h-11 rounded-[10px] bg-blue-700 px-[18px] text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {linking ? 'Linking…' : 'Link standee'}
        </button>
      </div>
    </section>
  );
}

function AgentsCard({
  agents,
  onAddAgent,
  onToggleAgent,
  onLoginAsAgent,
  onChangeAgentPin,
}: CounterSalePageProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAsBusyId, setLoginAsBusyId] = useState<string | null>(null);
  const [pinEditId, setPinEditId] = useState<string | null>(null);
  const [pinEditValue, setPinEditValue] = useState('');
  const [pinEditBusy, setPinEditBusy] = useState(false);
  const [pinEditError, setPinEditError] = useState<string | null>(null);

  const valid = /^[a-z0-9._-]{3,}$/i.test(username.trim()) && /^\d{3}$/.test(pin);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError('Username (3+ chars) and a 3-digit PIN are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAddAgent(username.trim(), pin);
      setUsername('');
      setPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t add agent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="agents-h" className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6">
      <CardHeader
        id="agents-h"
        icon={<UserPlus size={20} aria-hidden="true" />}
        title="Field agents"
        desc="Agents sign in to the counter-sale app with a username and 3-digit PIN."
      />

      <form onSubmit={submit} className="grid grid-cols-[1.4fr_1fr] gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="u" className="text-[13px] font-semibold">
            Username
          </label>
          <input
            id="u"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ravi.k"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pin" className="text-[13px] font-semibold">
            PIN
          </label>
          <div className="flex gap-1.5">
            <input
              id="pin"
              inputMode="numeric"
              maxLength={3}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="•••"
              className={`${inputCls} px-3 font-mono tracking-[0.2em]`}
            />
            <button
              type="button"
              aria-label="Generate random PIN"
              className={iconBtnCls}
              onClick={() => setPin(randomPin())}
            >
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert" className="col-span-full text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="col-span-full flex h-11 items-center justify-center gap-2 rounded-[10px] bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          <Plus size={16} aria-hidden="true" />
          {busy ? 'Adding…' : 'Add agent'}
        </button>
      </form>

      <div className="flex flex-col">
        <div className="flex justify-between border-b border-slate-100 px-1 pb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Agent</span>
          <span>Actions</span>
        </div>
        {agents.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">No agents yet. Add one above.</p>
        ) : null}
        {agents.map((a) => {
          const active = a.status === 'active';
          const editingPin = pinEditId === a.id;
          return (
            <div key={a.id} className="border-b border-slate-100 px-1 py-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-blue-900">
                  {a.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex min-w-[120px] flex-1 flex-col gap-0.5">
                  <span className="font-mono text-sm font-medium">{a.username}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${active ? 'text-green-800' : 'text-slate-500'}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-[7px] w-[7px] rounded-full ${active ? 'bg-green-600' : 'bg-slate-400'}`}
                    />
                    {active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={!active || loginAsBusyId === a.id}
                    onClick={async () => {
                      setLoginAsBusyId(a.id);
                      try {
                        await onLoginAsAgent(a.id);
                      } finally {
                        setLoginAsBusyId(null);
                      }
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    <LogIn size={14} aria-hidden="true" />
                    {loginAsBusyId === a.id ? 'Opening…' : 'Login as'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPin) {
                        setPinEditId(null);
                        setPinEditValue('');
                        setPinEditError(null);
                        return;
                      }
                      setPinEditId(a.id);
                      setPinEditValue('');
                      setPinEditError(null);
                    }}
                    className={`flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-[13px] font-semibold hover:bg-slate-50 ${
                      editingPin ? 'border-blue-700 text-blue-700' : 'border-slate-300 text-slate-900'
                    }`}
                  >
                    <KeyRound size={14} aria-hidden="true" />
                    Change password
                  </button>
                  <button
                    type="button"
                    onClick={() => void onToggleAgent(a.id, active ? 'disabled' : 'active')}
                    className={`h-9 rounded-lg border bg-white px-3 text-[13px] font-semibold ${
                      active
                        ? 'border-red-200 text-red-700 hover:bg-red-50'
                        : 'border-slate-300 text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
              {editingPin ? (
                <form
                  className="mt-3 flex flex-wrap items-end gap-2 pl-12"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!/^\d{3}$/.test(pinEditValue)) {
                      setPinEditError('Enter a 3-digit PIN.');
                      return;
                    }
                    setPinEditBusy(true);
                    setPinEditError(null);
                    void onChangeAgentPin(a.id, pinEditValue)
                      .then(() => {
                        setPinEditId(null);
                        setPinEditValue('');
                      })
                      .catch((err) => {
                        setPinEditError(err instanceof Error ? err.message : 'Could not update PIN.');
                      })
                      .finally(() => setPinEditBusy(false));
                  }}
                >
                  <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                    <label htmlFor={`pin-edit-${a.id}`} className="text-xs font-semibold text-slate-600">
                      New 3-digit PIN
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        id={`pin-edit-${a.id}`}
                        inputMode="numeric"
                        maxLength={3}
                        value={pinEditValue}
                        onChange={(e) => setPinEditValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className={`${inputCls} max-w-[140px] font-mono tracking-[0.2em]`}
                        placeholder="•••"
                        autoFocus
                      />
                      <button
                        type="button"
                        aria-label="Generate random PIN"
                        className={iconBtnCls}
                        onClick={() => setPinEditValue(randomPin())}
                      >
                        <RefreshCw size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={pinEditBusy || pinEditValue.length !== 3}
                    className="h-11 rounded-[10px] bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {pinEditBusy ? 'Saving…' : 'Save PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinEditId(null);
                      setPinEditValue('');
                      setPinEditError(null);
                    }}
                    className="h-11 rounded-[10px] border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  {pinEditError ? (
                    <p role="alert" className="w-full text-sm font-medium text-red-700">
                      {pinEditError}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LocationsCard({
  locations,
  onTransferShop,
}: {
  locations: ProvisionedLocation[];
  onTransferShop?: CounterSalePageProps['onTransferShop'];
}) {
  const [filter, setFilter] = useState<'all' | Service>('all');
  const [q, setQ] = useState('');
  const [transferEmail, setTransferEmail] = useState<Record<string, string>>({});
  const [transferBusy, setTransferBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return locations.filter(
      (l) =>
        (filter === 'all' || l.service === filter) &&
        (!needle ||
          l.businessName.toLowerCase().includes(needle) ||
          l.qrCode.toLowerCase().includes(needle) ||
          (l.agentUsername ?? '').toLowerCase().includes(needle)),
    );
  }, [locations, filter, q]);

  const tabs: { key: 'all' | Service; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'quickreview', label: 'QuickReview' },
    { key: 'quickcommerce', label: 'QuickCommerce' },
  ];

  async function transfer(businessId: string) {
    const email = (transferEmail[businessId] ?? '').trim();
    if (!email || !onTransferShop) return;
    setTransferBusy(businessId);
    try {
      await onTransferShop({ businessId, email });
      setTransferEmail((prev) => ({ ...prev, [businessId]: '' }));
    } finally {
      setTransferBusy(null);
    }
  }

  return (
    <section aria-labelledby="loc-h" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <h2 id="loc-h" className="text-lg font-bold">
            Provisioned locations
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {locations.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-[10px] bg-slate-100 p-[3px]">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={filter === t.key}
                onClick={() => setFilter(t.key)}
                className={`h-[38px] rounded-lg px-3 text-[13px] ${
                  filter === t.key ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'font-medium text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex items-center">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 text-slate-500" />
            <label htmlFor="flt" className="sr-only">
              Filter locations
            </label>
            <input
              id="flt"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Business, QR code or agent"
              className={`${inputCls} w-[260px] max-w-full pl-9`}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Business</th>
              <th className="px-4 py-3">QR code</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-6 py-3">Linked on</th>
            </tr>
          </thead>
          {rows.length > 0 ? (
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold">{l.businessName}</div>
                    {l.address ? <div className="text-xs text-slate-500">{l.address}</div> : null}
                    {l.onHoldingAccount && onTransferShop ? (
                      <div className="mt-2 flex max-w-sm flex-wrap gap-2">
                        <input
                          type="email"
                          placeholder="Merchant email to transfer"
                          className="min-w-[140px] flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                          value={transferEmail[l.businessId] ?? ''}
                          onChange={(e) =>
                            setTransferEmail((prev) => ({ ...prev, [l.businessId]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          disabled={transferBusy === l.businessId}
                          onClick={() => void transfer(l.businessId)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                        >
                          Transfer
                        </button>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5 font-mono">{l.qrCode}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      {SERVICE_LABEL[l.service]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono">
                    {l.agentUsername ?? <span className="font-sans text-slate-500">Admin</span>}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {new Date(l.linkedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-slate-100 text-slate-500">
            <QrCode size={26} aria-hidden="true" />
          </div>
          <div className="text-base font-bold">
            {locations.length === 0 ? 'No standees linked yet' : 'No locations match your filter'}
          </div>
          <p className="max-w-[420px] text-sm leading-relaxed text-slate-500">
            {locations.length === 0
              ? 'Locations appear here once an agent scans a standee on site or you link one above.'
              : 'Try a different search or service.'}
          </p>
          {locations.length === 0 ? (
            <a
              href="#qr"
              className="mt-1 inline-flex h-11 items-center rounded-[10px] border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50"
            >
              Link a standee
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

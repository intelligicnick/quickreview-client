import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { api, ApiError, getAccessToken } from '../../lib/api';
import { adminWhen } from '../../lib/admin-ui';
import {
  COUNTER_SALE_PIN_LENGTH,
  COUNTER_SALE_PIN_PATTERN,
  normalizeCounterSalePin,
  randomCounterSalePin,
} from '../../lib/counter-sale-pin';

type Agent = {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
};

type PlaceRow = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
};

type ProvisionRow = {
  id: string;
  qrCode: string;
  service: 'review' | 'menu';
  createdAt: string;
  agentUsername: string | null;
  business: {
    id: string;
    name: string;
    ownerUserId: string;
    onHoldingAccount: boolean;
  } | null;
  location: {
    id: string;
    name: string;
    googleReviewUrl: string | null;
    googlePlaceId: string | null;
    address: string | null;
  } | null;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function AdminCounterSalePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [provisions, setProvisions] = useState<ProvisionRow[]>([]);
  const [listQuery, setListQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');

  const [qrCode, setQrCode] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceRow[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceRow | null>(null);
  const [service, setService] = useState<'review' | 'menu'>('review');

  const [transferEmail, setTransferEmail] = useState<Record<string, string>>({});

  const agentAppUrl = `${window.location.origin}/counter-sale/`;
  const activeAgentCount = useMemo(() => agents.filter((a) => a.isActive).length, [agents]);
  const canLink = qrCode.trim().length >= 4 && selectedPlace;

  const loadAgents = useCallback(async () => {
    const data = await api<Agent[]>('/api/admin/counter-sale/agents');
    setAgents(data);
  }, []);

  const loadProvisions = useCallback(async () => {
    const suffix = appliedQuery.trim() ? `?q=${encodeURIComponent(appliedQuery.trim())}` : '';
    const data = await api<ProvisionRow[]>(`/api/admin/counter-sale/provisions${suffix}`);
    setProvisions(data);
  }, [appliedQuery]);

  useEffect(() => {
    void loadAgents().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load agents'));
    void loadProvisions().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load standees'));
  }, [loadAgents, loadProvisions]);

  async function addAgent(e: FormEvent) {
    e.preventDefault();
    if (!COUNTER_SALE_PIN_PATTERN.test(newPin)) {
      setError(`Enter a ${COUNTER_SALE_PIN_LENGTH}-digit PIN.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/api/admin/counter-sale/agents', {
        method: 'POST',
        body: { username: newUsername.trim(), pin: newPin },
      });
      setNewUsername('');
      setNewPin('');
      setMessage('Agent added.');
      await loadAgents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add agent');
    } finally {
      setBusy(false);
    }
  }

  async function toggleAgent(agent: Agent) {
    setError(null);
    try {
      await api(`/api/admin/counter-sale/agents/${agent.id}`, {
        method: 'PATCH',
        body: { isActive: !agent.isActive },
      });
      await loadAgents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update agent');
    }
  }

  async function changePin(agentId: string, pin: string) {
    await api(`/api/admin/counter-sale/agents/${agentId}/pin`, {
      method: 'PATCH',
      body: { pin },
    });
  }

  async function loginAsAgent(agentId: string) {
    setError(null);
    try {
      const data = await api<{ accessToken: string }>(`/api/admin/counter-sale/agents/${agentId}/session`, {
        method: 'POST',
      });
      const url = `${window.location.origin}/counter-sale/link#t=${encodeURIComponent(data.accessToken)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open agent session');
    }
  }

  async function searchPlaces(e: FormEvent) {
    e.preventDefault();
    const q = placeSearch.trim();
    if (q.length < 3) {
      setError('Type at least 3 characters to search.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rows = await api<PlaceRow[]>(`/api/counter-sale/places/search?q=${encodeURIComponent(q)}`);
      setPlaceResults(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Place search failed');
    } finally {
      setBusy(false);
    }
  }

  async function linkStandee() {
    if (!selectedPlace || !qrCode.trim()) return;
    if (!getAccessToken()) {
      setError('Sign in again to link standees.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api('/api/counter-sale/provisions', {
        method: 'POST',
        body: {
          qrCode: qrCode.trim(),
          placeId: selectedPlace.placeId,
          service,
        },
      });
      setMessage(`Linked standee ${qrCode.trim()} to ${selectedPlace.name}.`);
      setQrCode('');
      setSelectedPlace(null);
      setPlaceResults([]);
      setPlaceSearch('');
      await loadProvisions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not link standee');
    } finally {
      setBusy(false);
    }
  }

  async function transferBusiness(businessId: string, email: string) {
    setError(null);
    try {
      await api(`/api/admin/businesses/${businessId}/transfer`, {
        method: 'POST',
        body: { email: email.trim() },
      });
      setMessage('Business transferred to merchant.');
      await loadProvisions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Transfer failed');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Counter sale</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage field agents and standees linked at the counter. Agents use the{' '}
            <a href={agentAppUrl} className="font-semibold text-brand hover:underline" target="_blank" rel="noreferrer">
              counter-sale PWA
            </a>
            .
          </p>
        </div>
        <a
          href={agentAppUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold shadow-sm"
        >
          <Smartphone className="h-4 w-4" />
          Open PWA
          <ExternalLink className="h-3.5 w-3.5 text-muted" />
        </a>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Field agents" value={agents.length} />
        <StatCard label="Active agents" value={activeAgentCount} />
        <StatCard label="Standees linked" value={provisions.length} />
      </div>

      <section id="link-standee" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Link a standee</h2>
        <p className="mt-1 text-sm text-muted">Same flow as the field app — for desk provisioning.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold">QR code</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-mono uppercase"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="AB12CD34"
            />
          </label>
          <div>
            <span className="text-sm font-semibold">Service</span>
            <div className="mt-1 flex gap-2">
              {(['review', 'menu'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setService(key)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
                    service === key ? 'bg-ink text-white' : 'border border-line'
                  }`}
                >
                  {key === 'review' ? 'QuickReview' : 'QuickCommerce'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <form onSubmit={searchPlaces} className="mt-4 flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-xl border border-line px-3 py-2 text-sm"
            value={placeSearch}
            onChange={(e) => setPlaceSearch(e.target.value)}
            placeholder="Business name, city"
          />
          <button type="submit" disabled={busy} className="rounded-xl bg-paper px-4 py-2 text-sm font-semibold">
            Search Google
          </button>
        </form>
        {placeResults.length > 0 ? (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {placeResults.map((row) => (
              <li key={row.placeId}>
                <button
                  type="button"
                  onClick={() => setSelectedPlace(row)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                    selectedPlace?.placeId === row.placeId ? 'bg-brand/10 ring-1 ring-brand' : 'hover:bg-paper'
                  }`}
                >
                  {row.name}
                  {row.formattedAddress ? (
                    <span className="block text-xs text-muted">{row.formattedAddress}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          disabled={busy || !canLink}
          onClick={() => void linkStandee()}
          className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Link standee
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Field agents</h2>
        <form onSubmit={addAgent} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-semibold">Username</span>
            <input
              className="mt-1 block w-40 rounded-xl border border-line px-3 py-2"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="text-sm">
            <span className="font-semibold">{COUNTER_SALE_PIN_LENGTH}-digit PIN</span>
            <div className="mt-1 flex gap-1">
              <input
                className="w-28 rounded-xl border border-line px-3 py-2 font-mono tracking-widest"
                value={newPin}
                onChange={(e) => setNewPin(normalizeCounterSalePin(e.target.value))}
                inputMode="numeric"
                maxLength={COUNTER_SALE_PIN_LENGTH}
              />
              <button
                type="button"
                className="rounded-xl border border-line px-2"
                onClick={() => setNewPin(randomCounterSalePin())}
                aria-label="Random PIN"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add agent
          </button>
        </form>
        <ul className="mt-4 divide-y divide-line">
          {agents.map((agent) => (
            <li key={agent.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-semibold">{agent.username}</p>
                <p className="text-xs text-muted">
                  {agent.isActive ? 'Active' : 'Disabled'} · Added {adminWhen(agent.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loginAsAgent(agent.id)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                >
                  Open as agent
                </button>
                <button
                  type="button"
                  onClick={() => void toggleAgent(agent)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                >
                  {agent.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = randomCounterSalePin();
                    void changePin(agent.id, pin)
                      .then(() => {
                        setMessage(`New PIN for ${agent.username}: ${pin}`);
                        return loadAgents();
                      })
                      .catch((err) =>
                        setError(err instanceof ApiError ? err.message : 'Could not reset PIN'),
                      );
                  }}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                >
                  Reset PIN
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Linked standees</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedQuery(listQuery);
            }}
            className="flex gap-2"
          >
            <input
              className="rounded-xl border border-line px-3 py-1.5 text-sm"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Filter…"
            />
            <button type="submit" className="rounded-xl border border-line px-3 py-1.5 text-sm font-semibold">
              Search
            </button>
          </form>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase text-muted">
                <th className="py-2 pr-3">QR</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Service</th>
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2">Transfer</th>
              </tr>
            </thead>
            <tbody>
              {provisions.map((row) => (
                <tr key={row.id} className="border-b border-line/80">
                  <td className="py-3 pr-3 font-mono text-xs">{row.qrCode}</td>
                  <td className="py-3 pr-3">
                    <p className="font-medium">{row.location?.name ?? '—'}</p>
                    <p className="text-xs text-muted">{row.business?.name}</p>
                  </td>
                  <td className="py-3 pr-3">{row.service === 'review' ? 'QuickReview' : 'QuickCommerce'}</td>
                  <td className="py-3 pr-3 text-muted">{row.agentUsername ?? '—'}</td>
                  <td className="py-3">
                    {row.business?.onHoldingAccount ? (
                      <div className="flex gap-1">
                        <input
                          className="w-36 rounded-lg border border-line px-2 py-1 text-xs"
                          placeholder="Merchant email"
                          value={transferEmail[row.business.id] ?? ''}
                          onChange={(e) =>
                            setTransferEmail((prev) => ({ ...prev, [row.business!.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className="rounded-lg bg-ink px-2 py-1 text-xs font-semibold text-white"
                          onClick={() =>
                            void transferBusiness(row.business!.id, transferEmail[row.business!.id] ?? '')
                          }
                        >
                          Send
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">With merchant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {provisions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No standees linked yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

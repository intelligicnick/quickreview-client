import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, getAccessToken } from '../../lib/api';
import { counterSaleProvisionApi, CounterSaleApiError } from '../../lib/counter-sale-api';

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
  rating: number | null;
  reviewCount: number | null;
};

type ProvisionRow = {
  id: string;
  qrCode: string;
  service: 'review' | 'menu';
  createdAt: string;
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

  const loadAgents = useCallback(async () => {
    const data = await api<Agent[]>('/api/admin/counter-sale/agents');
    setAgents(data);
  }, []);

  const loadProvisions = useCallback(async (q: string) => {
    const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
    const data = await api<ProvisionRow[]>(`/api/admin/counter-sale/provisions${suffix}`);
    setProvisions(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadAgents(), loadProvisions(appliedQuery)]);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load counter sale data');
      }
    })();
  }, [loadAgents, loadProvisions, appliedQuery]);

  async function createAgent(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const created = await api<Agent>('/api/admin/counter-sale/agents', {
        method: 'POST',
        body: { username: newUsername.trim(), pin: newPin },
      });
      setNewUsername('');
      setNewPin('');
      setMessage('Agent created.');
      setAgents((prev) => [
        { ...created, createdAt: created.createdAt ?? new Date().toISOString() },
        ...prev.filter((row) => row.id !== created.id),
      ]);
      await loadAgents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create agent');
    } finally {
      setBusy(false);
    }
  }

  async function autologinAgent(agent: Agent) {
    if (!agent.isActive) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ accessToken: string }>(
        `/api/admin/counter-sale/agents/${agent.id}/session`,
        { method: 'POST' },
      );
      const url = `${window.location.origin}/counter-sale/link#t=${encodeURIComponent(data.accessToken)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open counter-sale app');
    } finally {
      setBusy(false);
    }
  }

  async function toggleAgent(agent: Agent) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/counter-sale/agents/${agent.id}`, {
        method: 'PATCH',
        body: { isActive: !agent.isActive },
      });
      await loadAgents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update agent');
    } finally {
      setBusy(false);
    }
  }

  async function searchPlaces(event: FormEvent) {
    event.preventDefault();
    const q = placeSearch.trim();
    if (q.length < 3) {
      setError('Type at least 3 characters to search Google.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rows = await counterSaleProvisionApi<PlaceRow[]>(
        `/api/counter-sale/places/search?q=${encodeURIComponent(q)}`,
        getAccessToken(),
      );
      setPlaceResults(rows);
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Place search failed');
    } finally {
      setBusy(false);
    }
  }

  async function linkStandee() {
    if (!selectedPlace) {
      setError('Select a Google place first.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await counterSaleProvisionApi<{ targetUrl: string | null; location: { googleReviewUrl: string } }>(
        '/api/counter-sale/provisions',
        getAccessToken(),
        {
          method: 'POST',
          body: {
            qrCode: qrCode.trim(),
            placeId: selectedPlace.placeId,
            service,
          },
        },
      );
      setMessage(`Linked. Review URL: ${result.location.googleReviewUrl ?? '—'}`);
      setQrCode('');
      setSelectedPlace(null);
      setPlaceResults([]);
      await loadProvisions(appliedQuery);
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Could not link standee');
    } finally {
      setBusy(false);
    }
  }

  async function transfer(businessId: string) {
    const email = (transferEmail[businessId] ?? '').trim();
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/businesses/${businessId}/transfer`, {
        method: 'POST',
        body: { email },
      });
      setMessage(`Transferred to ${email}.`);
      await loadProvisions(appliedQuery);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Transfer failed');
    } finally {
      setBusy(false);
    }
  }

  function onFilter(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(listQuery.trim());
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Counter sale</h1>
        <p className="mt-1 text-sm text-muted">
          Field agents use the counter-sale PWA. Provision standees here or let agents scan on site.
        </p>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>
      ) : null}

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Agents</h2>
        <p className="mt-1 text-sm text-muted">Username + 5-digit PIN for the counter-sale app.</p>
        <form onSubmit={createAgent} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-muted">Username</span>
            <input
              className="mt-1 block w-40 rounded-lg border border-line px-3 py-2"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9._-]+"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">5-digit PIN</span>
            <input
              className="mt-1 block w-28 rounded-lg border border-line px-3 py-2 font-mono"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
              required
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add agent
          </button>
        </form>
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            >
              <span className="font-mono font-semibold">{agent.username}</span>
              <span className={agent.isActive ? 'text-emerald-700' : 'text-muted'}>
                {agent.isActive ? 'Active' : 'Disabled'}
              </span>
              <div className="col-span-2 flex flex-wrap justify-end gap-3 sm:col-span-1">
                <button
                  type="button"
                  disabled={busy || !agent.isActive}
                  onClick={() => void autologinAgent(agent)}
                  className="text-sm font-medium text-accent hover:underline disabled:opacity-40"
                >
                  Autologin
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleAgent(agent)}
                  className="text-sm font-medium text-muted hover:text-ink hover:underline"
                >
                  {agent.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </li>
          ))}
          {agents.length === 0 ? <li className="py-4 text-sm text-muted">No agents yet.</li> : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Link standee (admin)</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-muted">QR code or /q/ URL</span>
            <input
              className="mt-1 block w-full max-w-md rounded-lg border border-line px-3 py-2 font-mono uppercase"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="AB12CD34"
            />
          </label>
          <div>
            <span className="text-sm text-muted">Service</span>
            <div className="mt-2 flex gap-2">
              {(['review', 'menu'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setService(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                    service === key ? 'bg-ink text-white' : 'border border-line bg-paper'
                  }`}
                >
                  {key === 'review' ? 'QuickReview' : 'QuickCommerce'}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={searchPlaces} className="flex flex-wrap gap-2">
            <input
              className="min-w-[200px] flex-1 rounded-lg border border-line px-3 py-2 text-sm"
              value={placeSearch}
              onChange={(e) => setPlaceSearch(e.target.value)}
              placeholder="Search Google place…"
            />
            <button type="submit" disabled={busy} className="rounded-lg border border-line px-4 py-2 text-sm font-medium">
              Search
            </button>
          </form>
          {placeResults.length > 0 ? (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {placeResults.map((row) => (
                <li key={row.placeId}>
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(row)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                      selectedPlace?.placeId === row.placeId ? 'bg-accent/10 ring-1 ring-accent' : 'hover:bg-paper'
                    }`}
                  >
                    <span className="font-medium">{row.name}</span>
                    {row.formattedAddress ? (
                      <span className="mt-0.5 block text-xs text-muted">{row.formattedAddress}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selectedPlace ? (
            <p className="text-sm">
              Selected: <strong>{selectedPlace.name}</strong>
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || !selectedPlace || !qrCode.trim()}
            onClick={() => void linkStandee()}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Link QR to Google profile
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Provisioned locations</h2>
          <form onSubmit={onFilter} className="flex gap-2">
            <input
              className="rounded-lg border border-line px-3 py-1.5 text-sm"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder="Filter…"
            />
            <button type="submit" className="rounded-lg border border-line px-3 py-1.5 text-sm">
              Apply
            </button>
          </form>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {provisions.map((row) => (
            <li key={row.id} className="space-y-2 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold">{row.qrCode}</span>
                <span className="rounded-full bg-paper px-2 py-0.5 text-xs uppercase">
                  {row.service === 'review' ? 'QuickReview' : 'QuickCommerce'}
                </span>
                {row.business?.onHoldingAccount ? (
                  <span className="text-xs text-amber-700">On holding account</span>
                ) : (
                  <span className="text-xs text-emerald-700">Transferred</span>
                )}
              </div>
              <p className="font-medium">{row.location?.name ?? row.business?.name}</p>
              {row.location?.address ? <p className="text-muted">{row.location.address}</p> : null}
              {row.location?.googleReviewUrl ? (
                <a href={row.location.googleReviewUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                  Google review link
                </a>
              ) : null}
              {row.business?.onHoldingAccount ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <input
                    type="email"
                    placeholder="Merchant email to transfer"
                    className="min-w-[200px] flex-1 rounded-lg border border-line px-3 py-1.5"
                    value={transferEmail[row.business.id] ?? ''}
                    onChange={(e) =>
                      setTransferEmail((prev) => ({ ...prev, [row.business!.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void transfer(row.business!.id)}
                    className="rounded-lg border border-line px-3 py-1.5 font-medium"
                  >
                    Transfer shop
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {provisions.length === 0 ? <li className="py-6 text-muted">No counter-sale setups yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}

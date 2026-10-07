import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Loader2, MapPin, Search } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';

type GoogleStatus = {
  oauthConfigured: boolean;
  placesConfigured: boolean;
  connected: boolean;
  googleEmail: string | null;
};

type GbpRow = {
  gbpLocationName: string;
  title: string;
  placeId: string | null;
  formattedAddress: string | null;
  phone: string | null;
  website: string | null;
  primaryCategory: string | null;
};

type PlaceRow = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
  primaryTypeDisplay: string | null;
  rating: number | null;
  reviewCount: number | null;
};

type ImportResult = {
  business: { id: string; name: string };
  locations: { id: string; name: string; googlePlaceId: string | null }[];
};

export function GoogleImportPanel({ onImported }: { onImported: () => void }) {
  const { refresh: refreshLocations } = useLocationContext();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [gbpRows, setGbpRows] = useState<GbpRow[]>([]);
  const [gbpError, setGbpError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceRow[]>([]);
  const [selected, setSelected] = useState<Record<string, GbpRow | PlaceRow>>({});
  const [businessName, setBusinessName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gbpOpen, setGbpOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await api<GoogleStatus>('/api/google/status');
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, []);

  const loadGbp = useCallback(async () => {
    try {
      const data = await api<{ items: GbpRow[]; error?: string }>('/api/google/locations');
      setGbpRows(data.items.filter((row) => row.placeId));
      setGbpError(data.error ?? null);
    } catch (err) {
      setGbpRows([]);
      setGbpError(err instanceof ApiError ? err.message : 'Could not load Google locations');
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (params.get('google') === 'connected') {
      setMessage('Google account connected. You can also pick locations from your managed list below.');
      setGbpOpen(true);
      params.delete('google');
      setParams(params, { replace: true });
      void loadStatus();
      void loadGbp();
    }
  }, [params, setParams, loadStatus, loadGbp]);

  useEffect(() => {
    if (status?.connected) void loadGbp();
  }, [status?.connected, loadGbp]);

  async function connectGoogle() {
    setError(null);
    try {
      const { url } = await api<{ url: string }>('/api/google/oauth/start');
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start Google sign-in');
    }
  }

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 3) {
      setError('Type at least 3 characters to search.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const rows = await api<PlaceRow[]>('/api/google/places/search', {
        method: 'POST',
        body: { query: q },
      });
      setSearchResults(rows);
      if (rows.length === 0) {
        setMessage('No places found. Try adding city or area name.');
      }
    } catch (err) {
      setSearchResults([]);
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  function toggleGbp(row: GbpRow) {
    if (!row.placeId) return;
    setSelected((current) => {
      const next = { ...current };
      if (next[row.placeId!]) delete next[row.placeId!];
      else next[row.placeId!] = row;
      return next;
    });
  }

  function togglePlace(row: PlaceRow) {
    setSelected((current) => {
      const next = { ...current };
      if (next[row.placeId]) delete next[row.placeId];
      else next[row.placeId] = row;
      return next;
    });
  }

  async function importSelected() {
    const keys = Object.keys(selected);
    if (keys.length === 0) {
      setError('Select at least one location.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const items = keys.map((placeId) => {
        const row = selected[placeId];
        if ('gbpLocationName' in row) {
          return {
            placeId,
            gbpLocationName: row.gbpLocationName,
            title: row.title,
          };
        }
        return { placeId, title: row.name };
      });
      const result = await api<ImportResult>('/api/google/import', {
        method: 'POST',
        body: {
          businessName: businessName.trim() || undefined,
          items,
        },
      });
      setMessage(
        `Imported ${result.locations.length} location${result.locations.length === 1 ? '' : 's'} into ${result.business.name}.`,
      );
      setSelected({});
      setSearchResults([]);
      await refreshLocations();
      onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = Object.keys(selected).length;
  const placesReady = status?.placesConfigured ?? false;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold">Find your shop on Google</h2>
          <p className="mt-1 text-sm text-muted">
            Search by business name and area — no Google account connect required. We pull public
            listing details and your Google review link.
          </p>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {placesReady ? (
        <form onSubmit={(event) => void runSearch(event)} className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="google-place-search">
            Search Google
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="google-place-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="e.g. Patel Jewellers, Panvel"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-sm outline-none ring-brand/20 focus:border-brand focus:ring-4"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-red-700">
          Place search is off on the server. Set <code className="text-xs">GOOGLE_MAPS_API_KEY</code>{' '}
          (or <code className="text-xs">mock</code> for local demo) in the API <code className="text-xs">.env</code>.
        </p>
      )}

      {searchResults.length > 0 ? (
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {searchResults.map((row) => (
            <li key={row.placeId}>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-brand/30">
                <input
                  type="checkbox"
                  checked={Boolean(selected[row.placeId])}
                  onChange={() => togglePlace(row)}
                  className="mt-1"
                />
                <span className="min-w-0 text-sm">
                  <span className="font-semibold">{row.name}</span>
                  {row.formattedAddress ? (
                    <span className="block text-muted">{row.formattedAddress}</span>
                  ) : null}
                  {row.primaryTypeDisplay ? (
                    <span className="block text-xs text-muted">{row.primaryTypeDisplay}</span>
                  ) : null}
                  {row.rating != null ? (
                    <span className="block text-xs text-muted">
                      {row.rating}★ · {row.reviewCount ?? 0} reviews
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedCount > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <label className="block text-sm font-medium">
            Business name (optional)
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder={selectedCount === 1 ? 'Uses shop name if empty' : 'Brand name for all selected outlets'}
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void importSelected()}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? 'Importing…' : `Import ${selectedCount} location${selectedCount === 1 ? '' : 's'}`}
          </button>
        </div>
      ) : null}

      {status?.oauthConfigured ? (
        <div className="mt-6 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setGbpOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-muted hover:text-ink"
          >
            Already manage listings on Google? Import from your account
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${gbpOpen ? 'rotate-180' : ''}`} />
          </button>
          {gbpOpen ? (
            <div className="mt-3">
              {status.connected ? (
                <>
                  <span className="inline-flex min-h-9 items-center rounded-xl bg-paper px-3 text-sm text-ink">
                    Connected{status.googleEmail ? `: ${status.googleEmail}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => void loadGbp()}
                    className="ml-2 inline-flex min-h-9 items-center rounded-xl border border-line px-3 text-sm font-semibold hover:border-brand/40"
                  >
                    Refresh list
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void connectGoogle()}
                  className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand/40"
                >
                  Connect Google Business Profile
                </button>
              )}
              {gbpRows.length > 0 ? (
                <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                  {gbpRows.map((row) => (
                    <li key={row.gbpLocationName}>
                      <label className="flex cursor-pointer gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-brand/30">
                        <input
                          type="checkbox"
                          checked={Boolean(row.placeId && selected[row.placeId])}
                          onChange={() => toggleGbp(row)}
                          className="mt-1"
                        />
                        <span className="min-w-0 text-sm">
                          <span className="font-semibold">{row.title}</span>
                          {row.formattedAddress ? (
                            <span className="block text-muted">{row.formattedAddress}</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : gbpError && status.connected ? (
                <p className="mt-2 text-sm text-muted">{gbpError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

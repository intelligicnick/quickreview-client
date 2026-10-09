import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';

type AdminLocation = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  address: string | null;
  phone: string | null;
  slug: string | null;
  menuMode: 'FOOD' | 'SERVICES' | 'SHOP';
  reviewCode: string | null;
  googlePlaceId: string | null;
  scanCount: number;
  metricsRefreshedAt: string | null;
  createdAt: string;
  business: {
    id: string;
    name: string;
    category: string | null;
    owner: { id: string; email: string; name: string } | null;
  };
};

export function AdminLocationsPage() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [rows, setRows] = useState<AdminLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(q: string) {
    setLoading(true);
    const suffix = q ? `?q=${encodeURIComponent(q)}` : '';
    try {
      const data = await api<AdminLocation[]>(`/api/admin/locations${suffix}`);
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load locations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(applied);
  }, [applied]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setApplied(query.trim());
  }

  async function setStatus(row: AdminLocation) {
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/api/admin/locations/${row.id}`, { method: 'PATCH', body: { status: next } });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this location');
    } finally {
      setBusyId(null);
    }
  }

  async function saveMeta(row: AdminLocation, slug: string, menuMode: AdminLocation['menuMode']) {
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/api/admin/locations/${row.id}`, {
        method: 'PATCH',
        body: { slug: slug.trim() || null, menuMode },
      });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save location settings');
    } finally {
      setBusyId(null);
    }
  }

  async function refreshMetrics(row: AdminLocation) {
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/api/admin/locations/${row.id}/refresh-metrics`, { method: 'POST' });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not refresh metrics');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminLocation) {
    if (!window.confirm(`Delete ${row.name}? The business stays.`)) return;
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/api/admin/locations/${row.id}`, { method: 'DELETE' });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this location');
    } finally {
      setBusyId(null);
    }
  }

  async function transfer(event: FormEvent<HTMLFormElement>, row: AdminLocation) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get('email') ?? '').trim();
    if (!email) return;
    if (!window.confirm(`Transfer ${row.business.name} and its locations to ${email}?`)) return;
    setBusyId(row.id);
    setError(null);
    try {
      await api(`/api/admin/businesses/${row.business.id}/transfer`, {
        method: 'POST',
        body: { email },
      });
      form.reset();
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not transfer this business');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Locations</h1>
      <p className="mt-1 text-sm text-muted">
        Every merchant location — search by business or site name, edit slug and menu mode.
      </p>
      <form onSubmit={onSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Location or business name"
          className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm"
        />
        <button type="submit" className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          Search
        </button>
      </form>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}
      {!loading && rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold">No locations yet</p>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{row.name}</p>
                <p className="text-sm text-muted">
                  {row.business.name}
                  {row.business.owner ? ` · ${row.business.owner.email}` : ''}
                </p>
                {row.address ? <p className="mt-1 text-sm text-muted">{row.address}</p> : null}
                <p className="mt-1 font-mono text-xs text-muted">
                  {row.googlePlaceId ? `Place ${row.googlePlaceId}` : 'No Google place ID'}
                  {row.reviewCode ? ` · /r/${row.reviewCode}` : ''}
                </p>
                <p className="text-xs text-muted">
                  Scans {row.scanCount}
                  {row.metricsRefreshedAt
                    ? ` · refreshed ${new Date(row.metricsRefreshedAt).toLocaleDateString()}`
                    : ' · metrics not refreshed'}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{row.status}</span>
            </div>
            <form
              className="mt-4 grid gap-2 sm:grid-cols-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const slug = String(new FormData(form).get('slug') ?? '');
                const menuMode = String(new FormData(form).get('menuMode')) as AdminLocation['menuMode'];
                void saveMeta(row, slug, menuMode);
              }}
            >
              <input
                name="slug"
                defaultValue={row.slug ?? ''}
                placeholder="Public slug"
                className="min-h-11 rounded-xl border border-line px-3 text-sm"
              />
              <select
                name="menuMode"
                defaultValue={row.menuMode}
                className="min-h-11 rounded-xl border border-line px-3 text-sm"
              >
                <option value="FOOD">Food menu</option>
                <option value="SERVICES">Services</option>
                <option value="SHOP">Shop catalogue</option>
              </select>
              <button
                type="submit"
                disabled={busyId === row.id}
                className="min-h-11 rounded-xl border border-line text-sm font-semibold disabled:opacity-50"
              >
                Save slug & mode
              </button>
            </form>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void refreshMetrics(row)}
                className="min-h-11 rounded-xl border border-line px-3 text-sm font-semibold disabled:opacity-50"
              >
                Refresh metrics
              </button>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void setStatus(row)}
                className="min-h-11 rounded-xl border border-line px-3 text-sm font-semibold disabled:opacity-50"
              >
                {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void remove(row)}
                className="min-h-11 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
            <form onSubmit={(event) => void transfer(event, row)} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                name="email"
                type="email"
                required
                placeholder="Transfer business to email"
                className="min-h-11 w-full rounded-xl border border-line px-3 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm"
              />
              <button
                type="submit"
                disabled={busyId === row.id}
                className="min-h-11 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Transfer
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}

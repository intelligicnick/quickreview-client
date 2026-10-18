import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { Sheet } from '../../components/admin/ui/Sheet';
import { Modal } from '../../components/admin/ui/Modal';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/admin-ui';

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

type PlanFilter = 'all' | 'paid' | 'trial' | 'none';

export function AdminLocationsPage() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [planFilter] = useState<PlanFilter>('all');
  const [rows, setRows] = useState<AdminLocation[]>([]);
  const [selected, setSelected] = useState<AdminLocation | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState('');
  const [menuMode, setMenuMode] = useState<AdminLocation['menuMode']>('FOOD');

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

  useEffect(() => {
    if (selected) {
      setSlug(selected.slug ?? '');
      setMenuMode(selected.menuMode);
    }
  }, [selected]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, statusFilter, planFilter]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setApplied(query.trim());
  }

  async function saveMeta() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/locations/${selected.id}`, {
        method: 'PATCH',
        body: { slug: slug.trim() || null, menuMode },
      });
      await load(applied);
      const updated = rows.find((r) => r.id === selected.id);
      if (updated) setSelected({ ...updated, slug: slug.trim() || null, menuMode });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save location settings');
    } finally {
      setBusy(false);
    }
  }

  async function refreshMetrics() {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/admin/locations/${selected.id}/refresh-metrics`, { method: 'POST' });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not refresh metrics');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(inactive: boolean) {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/admin/locations/${selected.id}`, {
        method: 'PATCH',
        body: { status: inactive ? 'INACTIVE' : 'ACTIVE' },
      });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selected || deleteConfirm !== selected.name) return;
    setBusy(true);
    try {
      await api(`/api/admin/locations/${selected.id}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setSelected(null);
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this location');
    } finally {
      setBusy(false);
    }
  }

  async function transfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
    if (!email) return;
    if (!window.confirm(`Transfer ${selected.business.name} to ${email}?`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/businesses/${selected.business.id}/transfer`, {
        method: 'POST',
        body: { email },
      });
      await load(applied);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not transfer');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Locations" subtitle="Every merchant site — search, edit slug and menu mode." />
      <form onSubmit={onSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Location or business name"
          className="admin-ctl admin-ctl-form w-full flex-1 px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="admin-ctl admin-ctl-form px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button type="submit" className="admin-btn-primary">Search</button>
      </form>
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      {loading ? <p className="admin-meta">Loading…</p> : null}
      <section className="admin-card admin-table-scroll p-4">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase text-[var(--admin-muted)]">
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Owner</th>
              <th className="py-2 pr-3">Mode</th>
              <th className="py-2 pr-3">Scans</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-[var(--admin-border-soft)] hover:bg-[var(--admin-border-soft)]/50"
                onClick={() => setSelected(row)}
              >
                <td className="py-3 pr-3">
                  <p className="font-semibold">{row.name}</p>
                  <p className="admin-meta text-xs">
                    {row.address?.split(',')[0] ?? '—'}
                    {row.slug ? ` · /go/${row.slug}` : ''}
                  </p>
                </td>
                <td className="py-3 pr-3">
                  {row.business.owner ? (
                    <Link
                      to={`/admin/merchants/${row.business.owner.id}`}
                      className="font-semibold text-[var(--admin-brand)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.business.owner.name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 pr-3">{row.menuMode}</td>
                <td className="py-3 pr-3">{row.scanCount}</td>
                <td className="py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Sheet open={Boolean(selected)} title={selected?.name ?? 'Location'} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--admin-muted)]">{selected.address ?? 'No address'}</p>
            <p className="font-mono-admin text-xs text-[var(--admin-muted)]">
              {selected.googlePlaceId ? `Place ${selected.googlePlaceId}` : 'No place ID'}
              {selected.reviewCode ? ` · /r/${selected.reviewCode}` : ''}
            </p>
            <button type="button" disabled={busy} onClick={() => void refreshMetrics()} className="admin-btn-secondary w-full text-sm">
              Refresh metrics
            </button>
            <p className="admin-meta text-xs">
              {selected.metricsRefreshedAt
                ? `Last refreshed ${formatDateTime(selected.metricsRefreshedAt)}`
                : 'Metrics not refreshed yet'}
            </p>
            <label className="block text-sm">
              <span className="admin-label">Public slug</span>
              <div className="mt-1 flex">
                <span className="admin-ctl flex items-center rounded-r-none border-r-0 bg-[var(--admin-border-soft)] px-2 text-xs">/go/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="admin-ctl admin-ctl-form w-full rounded-l-none px-3 text-sm"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="admin-label">Menu mode</span>
              <select
                value={menuMode}
                onChange={(e) => setMenuMode(e.target.value as AdminLocation['menuMode'])}
                className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              >
                <option value="FOOD">Food menu</option>
                <option value="SERVICES">Services</option>
                <option value="SHOP">Shop catalogue</option>
              </select>
            </label>
            <button type="button" disabled={busy} onClick={() => void saveMeta()} className="admin-btn-primary w-full">
              Save changes
            </button>
            <details className="rounded-[var(--admin-radius-ctl)] border border-[var(--admin-border)] p-3">
              <summary className="cursor-pointer text-sm font-semibold">Transfer to another merchant</summary>
              <form onSubmit={(e) => void transfer(e)} className="mt-3 flex flex-col gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Owner email"
                  className="admin-ctl admin-ctl-form px-3 text-sm"
                />
                <button type="submit" disabled={busy} className="admin-btn-secondary text-sm">Transfer business</button>
              </form>
            </details>
            <button
              type="button"
              disabled={busy}
              onClick={() => void setStatus(selected.status === 'ACTIVE')}
              className="admin-btn-secondary w-full text-sm"
            >
              {selected.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
            <button type="button" onClick={() => setDeleteOpen(true)} className="admin-btn-danger-outline w-full">
              Delete location…
            </button>
          </div>
        ) : null}
      </Sheet>

      <Modal open={deleteOpen} title="Delete location" onClose={() => setDeleteOpen(false)}>
        <p className="text-sm text-[var(--admin-muted)]">
          Type <strong>{selected?.name}</strong> to confirm. The business account stays.
        </p>
        <input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className="admin-ctl admin-ctl-form mt-3 w-full px-3 text-sm"
        />
        <button
          type="button"
          disabled={busy || deleteConfirm !== selected?.name}
          onClick={() => void remove()}
          className="admin-btn-danger-outline mt-4 w-full"
        >
          Delete permanently
        </button>
      </Modal>
    </div>
  );
}

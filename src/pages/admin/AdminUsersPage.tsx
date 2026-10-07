import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import type { PublicUser } from '../../lib/types';

type AdminUser = PublicUser & { businessCount: number };

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'unverified', label: 'Unverified' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'active', label: 'Active' },
] as const;

export function AdminUsersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const query = params.get('q') ?? '';
  const [draft, setDraft] = useState(query);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const search = new URLSearchParams();
      if (query) search.set('q', query);
      if (status) search.set('status', status);
      const suffix = search.toString() ? `?${search}` : '';
      try {
        const rows = await api<AdminUser[]>(`/api/admin/users${suffix}`);
        if (!cancelled) {
          setUsers(rows);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, status]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = draft.trim();
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next);
  }

  function setStatus(nextStatus: string) {
    const next = new URLSearchParams(params);
    if (nextStatus) next.set('status', nextStatus);
    else next.delete('status');
    setParams(next);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-muted">Search accounts, then open one to disable it or enter their panel.</p>
      <form onSubmit={onSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Name or email"
          className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm"
        />
        <button type="submit" className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id || 'all'}
            type="button"
            onClick={() => setStatus(filter.id)}
            className={`min-h-10 rounded-full px-3 text-sm font-semibold ${
              status === filter.id ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}
      {!loading && users.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold">No accounts match</p>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {users.map((person) => (
          <Link
            key={person.id}
            to={`/admin/users/${person.id}`}
            className="block rounded-2xl border border-line bg-white p-4 hover:border-brand/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{person.name}</p>
                <p className="truncate text-sm text-muted">{person.email}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                {person.businessCount} {person.businessCount === 1 ? 'business' : 'businesses'}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {person.isActive ? 'Active' : 'Disabled'}
              {person.emailVerified ? '' : ' · Email not verified'}
              {person.isSuperAdmin ? ' · Super admin' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

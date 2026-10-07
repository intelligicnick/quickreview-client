import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { PublicUser } from '../../lib/types';

type Account = PublicUser & {
  businesses: {
    id: string;
    name: string;
    category: string | null;
    isActive: boolean;
    createdAt: string;
    locations: { id: string; name: string; status: string; address: string | null }[];
  }[];
};

export function AdminUserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me, rememberImpersonation, forgetImpersonation, setSession } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    if (!userId) return;
    const data = await api<Account>(`/api/admin/users/${userId}`);
    setAccount(data);
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<Account>(`/api/admin/users/${userId}`);
        if (!cancelled) setAccount(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this account');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function patch(body: { isActive?: boolean; emailVerified?: boolean }, action: string) {
    if (!userId) return;
    setBusy(action);
    setError(null);
    try {
      await api(`/api/admin/users/${userId}`, { method: 'PATCH', body });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this account');
    } finally {
      setBusy(null);
    }
  }

  async function openPanel() {
    if (!userId || !account || !me) return;
    if (!window.confirm(`Open ${account.name}'s merchant panel? You can return from the banner.`)) return;
    setBusy('login');
    setError(null);
    try {
      const minted = await api<{ ticket: string; resumeToken: string }>(
        `/api/admin/users/${userId}/login-as`,
        { method: 'POST' },
      );
      rememberImpersonation({
        resumeToken: minted.resumeToken,
        actorName: me.name,
        actorEmail: me.email,
      });
      try {
        const session = await api<{ user: PublicUser; accessToken: string }>('/api/auth/login-as', {
          method: 'POST',
          auth: false,
          body: { token: minted.ticket },
        });
        setSession(session.user, session.accessToken);
        navigate('/app', { replace: true });
      } catch (err) {
        forgetImpersonation();
        throw err;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open their panel');
      setBusy(null);
    }
  }

  if (!account && !error) return <p className="text-sm text-muted">Loading…</p>;

  const isSelf = account?.id === me?.id;

  return (
    <div>
      <Link to="/admin/users" className="text-sm font-semibold text-brand">
        All users
      </Link>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {account ? (
        <>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{account.name}</h1>
          <p className="mt-1 text-sm text-muted">{account.email}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {account.isActive ? 'Active' : 'Disabled'}
            {account.emailVerified ? ' · Email verified' : ' · Email not verified'}
            {account.isSuperAdmin ? ' · Super admin' : ''}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {account.isActive ? (
              <button
                type="button"
                disabled={Boolean(busy) || isSelf}
                onClick={() => void patch({ isActive: false }, 'disable')}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50"
              >
                {busy === 'disable' ? 'Disabling…' : 'Disable account'}
              </button>
            ) : (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void patch({ isActive: true }, 'enable')}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50"
              >
                {busy === 'enable' ? 'Enabling…' : 'Enable account'}
              </button>
            )}
            {!account.emailVerified ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void patch({ emailVerified: true }, 'verify')}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50"
              >
                {busy === 'verify' ? 'Saving…' : 'Mark email verified'}
              </button>
            ) : null}
            {!account.isSuperAdmin ? (
              <button
                type="button"
                disabled={Boolean(busy) || !account.isActive}
                onClick={() => void openPanel()}
                className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {busy === 'login' ? 'Opening…' : 'Open their panel'}
              </button>
            ) : null}
          </div>
          {isSelf ? <p className="mt-3 text-sm text-muted">This is your super admin account.</p> : null}
          <h2 className="mt-8 font-bold">Businesses they own</h2>
          {account.businesses.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No businesses yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {account.businesses.map((business) => (
                <div key={business.id} className="rounded-2xl border border-line bg-white p-4">
                  <p className="font-semibold">{business.name}</p>
                  <p className="text-sm text-muted">{business.category || 'No category'}</p>
                  {business.locations.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">No locations</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {business.locations.map((location) => (
                        <li key={location.id}>
                          {location.name} · {location.status}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

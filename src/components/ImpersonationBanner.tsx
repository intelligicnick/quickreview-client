import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ImpersonationBanner() {
  const { user, impersonation, exitImpersonation, signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!impersonation) return null;

  async function exit() {
    setBusy(true);
    setError(null);
    try {
      const admin = await exitImpersonation();
      if (!admin) {
        navigate('/', { replace: true });
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        await signOut();
        navigate('/', { replace: true });
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Could not return to Super Admin');
      setBusy(false);
    }
  }

  return (
    <div className="bg-ink px-4 py-2 text-white sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs sm:text-sm">
          Viewing as <span className="font-semibold">{user?.name}</span>
        </p>
        <button
          type="button"
          onClick={() => void exit()}
          disabled={busy}
          className="inline-flex min-h-8 items-center rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-ink disabled:opacity-60 sm:text-sm"
        >
          {busy ? 'Returning…' : 'Exit to Super Admin'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-200">{error}</p> : null}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ImpersonationBanner() {
  const { user, impersonation, exitImpersonation, clearSession } = useAuth();
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
        navigate('/login', { replace: true });
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        clearSession();
        navigate('/login', { replace: true });
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Could not return to Super Admin');
      setBusy(false);
    }
  }

  return (
    <div className="bg-ink px-4 py-3 text-white sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          You are in <span className="font-semibold">{user?.name}</span>&apos;s merchant panel.
        </p>
        <button
          type="button"
          onClick={() => void exit()}
          disabled={busy}
          className="inline-flex min-h-10 items-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {busy ? 'Returning…' : 'Back to Super Admin'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-200">{error}</p> : null}
    </div>
  );
}

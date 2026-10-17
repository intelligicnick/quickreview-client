import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { counterSaleApi, CounterSaleApiError, getCounterSaleToken, setCounterSaleToken } from '../../lib/counter-sale-api';

export function CounterSaleLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (getCounterSaleToken()) {
    return <Navigate to="/counter-sale/link" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await counterSaleApi<{ accessToken: string }>('/api/counter-sale/auth/login', {
        method: 'POST',
        body: { username: username.trim(), pin },
      });
      setCounterSaleToken(data.accessToken);
      navigate('/counter-sale/link', { replace: true });
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 px-4 py-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted">Use the username and PIN from your supervisor.</p>
      </div>
      {error ? <p className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <label className="block text-sm">
          <span className="font-semibold">Username</span>
          <input
            className="mt-2 w-full rounded-xl border border-line px-3 py-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">5-digit PIN</span>
          <input
            className="mt-2 w-full rounded-xl border border-line px-3 py-3 font-mono text-lg tracking-widest"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{5}"
            maxLength={5}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy || pin.length !== 5}
          className="btn-gradient w-full py-3.5 text-sm font-bold disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

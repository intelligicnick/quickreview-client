import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Field, inputClass } from '../components/AuthCard';
import { api, ApiError } from '../lib/api';
import { homePath, useAuth } from '../lib/auth';
import type { PublicUser } from '../lib/types';

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ user: PublicUser; accessToken: string }>('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        },
      });
      setSession(data.user, data.accessToken);
      navigate(homePath(data.user), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to Quick CRM — simple CRM for small business."
      onSubmit={onSubmit}
      submitLabel="Sign in"
      busy={busy}
      error={error}
      footer={
        <>
          <Link className="font-semibold text-brand" to="/forgot-password">
            Forgot password
          </Link>
          <span className="mx-2">·</span>
          New here?{' '}
          <Link className="font-semibold text-brand" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <Field label="Email">
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
    </AuthCard>
  );
}

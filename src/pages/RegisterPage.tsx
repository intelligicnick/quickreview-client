import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Field, inputClass } from '../components/AuthCard';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PublicUser } from '../lib/types';

export function RegisterPage() {
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
      const data = await api<{ user: PublicUser; accessToken: string }>('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        },
      });
      setSession(data.user, data.accessToken);
      navigate('/verify-email', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create account');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create your QuickReview account"
      subtitle="Create your account, then set up Quick CRM in under 2 minutes."
      onSubmit={onSubmit}
      submitLabel="Create account"
      busy={busy}
      error={error}
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-semibold text-brand" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <Field label="Name">
        <input className={inputClass} name="name" autoComplete="name" required minLength={2} />
      </Field>
      <Field label="Email">
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <p className="text-xs text-muted">At least 8 characters, including a letter and a number.</p>
    </AuthCard>
  );
}

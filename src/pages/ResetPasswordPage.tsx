import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard, Field, inputClass } from '../components/AuthCard';
import { api, ApiError } from '../lib/api';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: {
          token,
          password: String(form.get('password') ?? ''),
        },
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthCard
        title="Reset link missing"
        subtitle="Open the link from your email, or request a new one."
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Request a new link"
        footer={
          <Link className="font-semibold text-brand" to="/forgot-password">
            Forgot password
          </Link>
        }
      >
        <p className="text-sm text-muted">No token was found in the URL.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a password with at least 8 characters, including a letter and a number."
      onSubmit={onSubmit}
      submitLabel="Update password"
      busy={busy}
      error={error}
      footer={
        <Link className="font-semibold text-brand" to="/login">
          Back to sign in
        </Link>
      }
    >
      <Field label="New password">
        <input
          className={inputClass}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
    </AuthCard>
  );
}

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard, Field, inputClass } from '../components/AuthCard';
import { api, ApiError } from '../lib/api';

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email: String(form.get('email') ?? '') },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send reset email');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="If that account exists, we sent a reset link. In local development the link is printed in the API console."
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Back to sign in"
        footer={
          <Link className="font-semibold text-brand" to="/login">
            Return to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted">We never confirm whether an email is registered.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We’ll email a reset link if the account exists."
      onSubmit={onSubmit}
      submitLabel="Send reset link"
      busy={busy}
      error={error}
      footer={
        <Link className="font-semibold text-brand" to="/login">
          Back to sign in
        </Link>
      }
    >
      <Field label="Email">
        <input className={inputClass} name="email" type="email" required />
      </Field>
    </AuthCard>
  );
}

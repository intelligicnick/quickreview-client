import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { api, ApiError, getAccessToken } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { PublicUser } from '../lib/types';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { user, setSession } = useAuth();
  const [status, setStatus] = useState<'idle' | 'working' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('Check the API console for your verification link in local development.');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setStatus('working');
    void (async () => {
      try {
        const verified = await api<PublicUser>('/api/auth/verify-email', {
          method: 'POST',
          auth: false,
          body: { token },
        });
        if (cancelled) return;
        const access = getAccessToken();
        if (user && access) {
          setSession({ ...user, ...verified, emailVerified: true }, access);
        }
        setStatus('ok');
        setMessage('Your email is verified. You can continue to the dashboard.');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'Verification failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('working');
    try {
      await api('/api/auth/resend-verification', { method: 'POST' });
      setStatus('idle');
      setMessage('A new verification email was sent. In local development, open the API console.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Could not resend');
    }
  }

  return (
    <AuthCard
      title={status === 'ok' ? 'Email verified' : 'Verify your email'}
      subtitle={message}
      onSubmit={status === 'ok' ? (event) => event.preventDefault() : resend}
      submitLabel={status === 'ok' ? 'Continue' : status === 'working' ? 'Working…' : 'Resend email'}
      busy={status === 'working'}
      footer={
        <Link className="font-semibold text-brand" to={status === 'ok' || user ? '/app' : '/login'}>
          {status === 'ok' || user ? 'Go to dashboard' : 'Back to sign in'}
        </Link>
      }
    >
      <p className="text-sm text-muted">
        QuickReview only sends a link. We never ask for your password in email.
      </p>
    </AuthCard>
  );
}

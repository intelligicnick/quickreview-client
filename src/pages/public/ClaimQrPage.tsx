import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { BrandMark } from '../../components/BrandMark';

type Resolve = {
  code: string;
  targetUrl: string | null;
  assigned: boolean;
};

export function ClaimQrPage() {
  const { code: rawCode = '' } = useParams();
  const displayCode = rawCode.trim().toUpperCase();
  const [state, setState] = useState<'loading' | 'redirect' | 'unassigned' | 'missing' | 'error'>('loading');
  const [qr, setQr] = useState<Resolve | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!displayCode) {
        setState('missing');
        return;
      }
      try {
        const data = await api<Resolve>(`/api/public/q/${encodeURIComponent(displayCode)}`, { auth: false });
        if (cancelled) return;
        const target = data.targetUrl?.trim();
        if (target && data.assigned) {
          setState('redirect');
          window.location.replace(target);
          return;
        }
        setQr(data);
        setState('unassigned');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setState('missing');
        else {
          setState('error');
          setError(err instanceof ApiError ? err.message : 'Something went wrong');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [displayCode]);

  async function copyCode() {
    const value = qr?.code ?? displayCode;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (state === 'loading' || state === 'redirect') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-sm">
        <BrandMark className="mx-auto !h-8" />
        {state === 'unassigned' && qr ? (
          <>
            <p className="mt-6 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              Not activated yet
            </p>
            <p className="mt-2 text-center font-mono text-2xl font-extrabold tracking-wider">{qr.code}</p>
            <p className="mt-4 text-center text-sm text-muted">
              Link this standee in your QuickReview dashboard under{' '}
              <span className="font-semibold">QuickReview → Link standee</span>.
            </p>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-semibold"
            >
              {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy code'}
            </button>
            <Link
              to="/login"
              className="mt-3 block text-center text-sm font-semibold text-brand"
            >
              Log in to activate
            </Link>
          </>
        ) : null}
        {state === 'missing' ? (
          <p className="mt-6 text-center text-sm text-muted">We could not find that QR code.</p>
        ) : null}
        {state === 'error' ? (
          <p className="mt-6 text-center text-sm text-red-700">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

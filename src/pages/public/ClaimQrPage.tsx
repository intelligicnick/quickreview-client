import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const [error, setError] = useState<string | null>(null);

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
        {state === 'unassigned' ? (
          <p className="mt-6 text-center text-sm text-muted">No data found</p>
        ) : null}
        {state === 'missing' ? (
          <p className="mt-6 text-center text-sm text-muted">No data found</p>
        ) : null}
        {state === 'error' ? (
          <p className="mt-6 text-center text-sm text-red-700">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

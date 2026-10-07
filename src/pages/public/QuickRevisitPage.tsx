import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Gift, Loader2, PartyPopper, Sparkles } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { BrandMark } from '../../components/BrandMark';

type PublicPage = {
  code: string;
  businessName: string;
  customerNameMode: 'optional' | 'required';
};

type CheckInResult = {
  outcome: string;
  businessName: string;
  customer: { name: string | null; mobileMasked: string };
  totalVisits: number;
  alreadyCheckedInToday: boolean;
  progress: {
    hasRewards: boolean;
    nextReward: {
      name: string;
      description: string | null;
      threshold: number;
      rewardValue: string | null;
    } | null;
    remaining: number;
    progressCurrent: number;
    progressTarget: number;
    progressInSpan?: number;
    progressSpan?: number;
  };
  unlockedReward: {
    name: string;
    rewardCode: string;
    customerRewardId: string;
  } | null;
};

type Step = 'form' | 'result';

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function QuickRevisitPage() {
  const { code = '' } = useParams();
  const [page, setPage] = useState<PublicPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('form');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const idempotencyKey = useRef(newIdempotencyKey());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<PublicPage>(
          `/api/public/quick-revisit/${encodeURIComponent(code)}`,
          { auth: false },
        );
        if (!cancelled) setPage(data);
      } catch (err) {
        if (!cancelled) {
          setPage(null);
          setError(
            err instanceof ApiError
              ? err.message
              : 'This Quick Revisit link is not available',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const progressPct = useMemo(() => {
    if (!result?.progress.nextReward) return 100;
    const { progressCurrent, progressTarget } = result.progress;
    if (!progressTarget) return 0;
    return Math.min(100, Math.round((progressCurrent / progressTarget) * 100));
  }, [result]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await api<CheckInResult>(
        `/api/public/quick-revisit/${encodeURIComponent(code)}/check-in`,
        {
          method: 'POST',
          auth: false,
          body: {
            mobile,
            name: name.trim() || undefined,
            idempotencyKey: idempotencyKey.current,
            sessionId: idempotencyKey.current,
          },
        },
      );
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record your visit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand/5 to-paper text-sm text-muted">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (error && !page) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 text-center shadow-sm">
          <BrandMark className="mx-auto !h-8" />
          <p className="mt-6 text-lg font-semibold text-ink">Unavailable</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand/8 via-paper to-paper px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <BrandMark className="mx-auto !h-7 opacity-80" />

        {step === 'form' ? (
          <div className="mt-8 rounded-3xl border border-line/80 bg-white p-6 shadow-lg shadow-brand/5">
            <p className="text-center text-sm font-medium text-muted">Welcome to</p>
            <h1 className="mt-1 text-center text-2xl font-bold tracking-tight text-ink">
              {page.businessName}
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Track your visits &amp; unlock rewards
            </p>

            <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Mobile number</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                  className="mt-2 w-full rounded-2xl border border-line px-4 py-4 text-lg tracking-wide outline-none ring-brand focus:ring-2"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </label>

              {page.customerNameMode === 'required' || name ? (
                <label className="block">
                  <span className="text-sm font-semibold text-ink">
                    Your name {page.customerNameMode === 'optional' ? '(optional)' : ''}
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Add your name"
                    className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-base outline-none ring-brand focus:ring-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={page.customerNameMode === 'required'}
                  />
                </label>
              ) : (
                <button
                  type="button"
                  className="text-sm font-semibold text-brand"
                  onClick={() => setName(' ')}
                >
                  + Add your name
                </button>
              )}

              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-md shadow-brand/25 hover:bg-brand-dark disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Continue
              </button>
            </form>
          </div>
        ) : null}

        {step === 'result' && result ? (
          <div className="mt-8 space-y-5">
            {result.unlockedReward ? (
              <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-lg">
                <PartyPopper className="mx-auto h-10 w-10 text-amber-500" />
                <p className="mt-3 text-lg font-bold text-ink">Congratulations!</p>
                <p className="text-sm text-muted">You&apos;ve unlocked</p>
                <p className="mt-2 text-2xl font-extrabold text-brand">{result.unlockedReward.name}</p>
                <p className="mt-4 font-mono text-sm tracking-widest text-ink">
                  REWARD CODE: {result.unlockedReward.rewardCode}
                </p>
                <p className="mt-3 text-xs text-muted">Show this reward to staff</p>
              </div>
            ) : null}

            <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-lg">
              {result.alreadyCheckedInToday ? (
                <>
                  <p className="text-lg font-semibold text-ink">You&apos;re already checked in today! 😊</p>
                  <p className="mt-1 text-sm text-muted">Visit count stays the same</p>
                </>
              ) : (
                <p className="text-lg font-semibold text-ink">
                  Welcome back{result.customer.name ? `, ${result.customer.name.trim()}` : ''}! 👋
                </p>
              )}

              <div className="mt-8">
                <p className="text-7xl font-black tabular-nums tracking-tight text-brand">
                  {result.totalVisits}
                </p>
                <p className="mt-1 text-sm font-bold uppercase tracking-widest text-muted">Visits</p>
              </div>

              <p className="mt-6 text-sm text-muted">
                You&apos;ve visited us <span className="font-semibold text-ink">{result.totalVisits}</span>{' '}
                {result.totalVisits === 1 ? 'time' : 'times'}.
              </p>

              {result.progress.hasRewards && result.progress.nextReward ? (
                <div className="mt-8 rounded-2xl bg-paper p-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Sparkles className="h-4 w-4 text-brand" />
                    Your next reward
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {result.progress.progressCurrent} / {result.progress.progressTarget} visits
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Only <span className="font-semibold text-brand">{result.progress.remaining}</span> more
                    visit{result.progress.remaining === 1 ? '' : 's'} to unlock your reward.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-3">
                    <Gift className="h-5 w-5 shrink-0 text-brand" />
                    <div>
                      <p className="font-bold text-ink">{result.progress.nextReward.name}</p>
                      {result.progress.nextReward.rewardValue ? (
                        <p className="text-sm text-muted">{result.progress.nextReward.rewardValue}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-base font-medium text-ink">
                  Thank you for coming back! 🎉
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

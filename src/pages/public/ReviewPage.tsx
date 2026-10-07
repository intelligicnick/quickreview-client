import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  MessageSquareLock,
  Sparkles,
  Star,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { RateCard } from '../../components/review/RateCard';

type PublicReview = {
  code: string;
  name: string;
  address: string | null;
  category: string | null;
  googlePlaceId: string | null;
  googleReviewUrl: string | null;
};

type Step = 'rating' | 'generating' | 'suggestions' | 'private-feedback' | 'thank-you';

const RATING_OPTIONS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Terrible', emoji: '😢' },
  2: { label: 'Okay', emoji: '😐' },
  3: { label: 'Happy', emoji: '😊' },
  4: { label: 'Very Good', emoji: '😄' },
  5: { label: 'Excellent', emoji: '🤩' },
};

const GENERATING_MESSAGES = [
  'Our AI is crafting personalised review options based on your rating…',
  'Reviews like yours help other customers make wise decisions.',
  'Your feedback shines a light for people discovering this place.',
  'Honest voices like yours help great businesses get noticed.',
];

const SUBSCRIPTION_UNAVAILABLE_TITLE = 'No Subscription!';

function fallbackDrafts(name: string, stars: number): string[] {
  return [
    `Had a ${stars}-star experience at ${name}. Would recommend to friends and family.`,
    `${name} exceeded my expectations — friendly team and great service.`,
    `Really pleased with my visit to ${name}. Professional, quick, and worth every rupee.`,
  ];
}

export function ReviewPage() {
  const { code = '' } = useParams();
  const [shop, setShop] = useState<PublicReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState('Unavailable');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('rating');
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [privateFeedbackText, setPrivateFeedbackText] = useState('');
  const [privateFeedbackError, setPrivateFeedbackError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setErrorTitle('Unavailable');
      try {
        const data = await api<PublicReview>(`/api/public/r/${encodeURIComponent(code)}`, { auth: false });
        if (!cancelled) setShop(data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 402) {
            setErrorTitle(SUBSCRIPTION_UNAVAILABLE_TITLE);
            setError(err.message || 'This review page is not active yet.');
          } else {
            setErrorTitle('Unavailable');
            setError(err instanceof ApiError ? err.message : 'This review link is not available');
          }
          setShop(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (step !== 'generating') return;
    setMessageIndex(0);
    const id = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % GENERATING_MESSAGES.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [step]);

  async function record(
    type: 'star' | 'private' | 'google_open',
    payload: { stars: number; message?: string },
  ) {
    await api(`/api/public/r/${encodeURIComponent(code)}/events`, {
      method: 'POST',
      auth: false,
      body: { type, ...payload },
    });
  }

  async function generateSuggestions(starRating: number) {
    if (!shop) return;
    setStep('generating');
    setSuggestionsError(null);
    setSuggestions([]);
    setSelectedSuggestionIndex(0);
    try {
      const data = await api<{ suggestions: string[] }>(
        `/api/public/r/${encodeURIComponent(code)}/suggestions`,
        { method: 'POST', auth: false, body: { stars: starRating } },
      );
      setSuggestions(data.suggestions.length ? data.suggestions : fallbackDrafts(shop.name, starRating));
      setStep('suggestions');
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : 'Could not generate review suggestions.');
      setSuggestions(fallbackDrafts(shop.name, starRating));
      setStep('suggestions');
    }
  }

  function handleSelectRating(value: number) {
    if (!shop || step !== 'rating') return;
    setSelected(value);
    void record('star', { stars: value }).catch(() => {
      /* still advance UX */
    });
    if (value <= 3) {
      setPrivateFeedbackText('');
      setPrivateFeedbackError(null);
      setStep('private-feedback');
      return;
    }
    void generateSuggestions(value);
  }

  async function handleSubmitPrivateFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shop || !selected || submittingFeedback) return;
    const trimmed = privateFeedbackText.trim();
    if (!trimmed) {
      setPrivateFeedbackError('Please share a few words about your experience.');
      return;
    }
    setSubmittingFeedback(true);
    setPrivateFeedbackError(null);
    try {
      await record('private', { stars: selected, message: trimmed });
      setStep('thank-you');
    } catch (err) {
      setPrivateFeedbackError(
        err instanceof ApiError ? err.message : 'Could not send your feedback. Please try again.',
      );
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleCopyAndOpenGoogle() {
    if (!shop || !suggestions[selectedSuggestionIndex]) return;
    const text = suggestions[selectedSuggestionIndex];
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Still open Google when clipboard blocked.
    }
    if (selected) {
      void record('google_open', { stars: selected }).catch(() => undefined);
    }
    if (shop.googleReviewUrl) {
      window.open(shop.googleReviewUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleWriteOwn() {
    if (!shop?.googleReviewUrl) return;
    window.open(shop.googleReviewUrl, '_blank', 'noopener,noreferrer');
  }

  function handleBackToStars() {
    setStep('rating');
    setSuggestions([]);
    setSelectedSuggestionIndex(0);
    setSuggestionsError(null);
    setPrivateFeedbackText('');
    setPrivateFeedbackError(null);
    setHovered(0);
  }

  const activeRating = hovered || selected;
  const previewOption = hovered
    ? RATING_OPTIONS[hovered]
    : selected
      ? RATING_OPTIONS[selected]
      : null;

  return (
    <div className="relative flex min-h-dvh flex-col bg-white sm:bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden sm:block review-page-bg"
      />

      <main className="relative z-10 flex flex-1 flex-col sm:items-center sm:justify-center sm:px-4 sm:py-12">
        {loading ? (
          <p className="animate-fade-up flex flex-1 items-center justify-center text-muted sm:flex-none">
            Loading…
          </p>
        ) : error && !shop ? (
          <div className="animate-fade-up w-full sm:w-auto">
            <RateCard>
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{errorTitle}</h1>
                {errorTitle === SUBSCRIPTION_UNAVAILABLE_TITLE ? (
                  <div
                    className="relative mx-auto mt-5 flex h-40 w-full max-w-[260px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-paper"
                    aria-hidden
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#e2e8f0_0,#e2e8f0_2px,transparent_2px,transparent_10px)] opacity-70 blur-[1px]" />
                    <p className="relative px-4 text-sm font-semibold text-muted">Review page inactive</p>
                  </div>
                ) : null}
                <p className="mt-3 text-sm text-muted">{error}</p>
                {errorTitle === SUBSCRIPTION_UNAVAILABLE_TITLE ? (
                  <p className="mt-3 text-sm text-muted">
                    If you are the business owner, activate QuickReview in your merchant panel under{' '}
                    <span className="font-semibold text-brand">Subscription</span>.
                  </p>
                ) : null}
              </div>
            </RateCard>
          </div>
        ) : shop && step === 'rating' ? (
          <div className="animate-fade-up w-full sm:w-auto">
            <RateCard>
              <div className="text-center">
                <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-ink sm:text-[1.85rem]">
                  {shop.name}
                </h1>
                {shop.address ? (
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{shop.address}</p>
                ) : (
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    How was your experience with us today?
                  </p>
                )}

                <div
                  className="mt-8 flex items-center justify-center gap-1.5 sm:gap-2"
                  onMouseLeave={() => setHovered(0)}
                  role="radiogroup"
                  aria-label="Star rating"
                >
                  {[1, 2, 3, 4, 5].map((value) => {
                    const filled = value <= activeRating;
                    const option = RATING_OPTIONS[value];
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected === value}
                        aria-label={`${value} stars — ${option.label}`}
                        className="rounded-xl p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        onMouseEnter={() => setHovered(value)}
                        onFocus={() => setHovered(value)}
                        onBlur={() => setHovered(0)}
                        onClick={() => handleSelectRating(value)}
                      >
                        <Star
                          className={`h-11 w-11 transition-all sm:h-12 sm:w-12 ${
                            filled
                              ? 'fill-gold text-gold drop-shadow-[0_0_10px_rgba(245,180,0,0.55)]'
                              : 'fill-transparent text-slate-300'
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex min-h-9 items-center justify-center" aria-live="polite">
                  {previewOption ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-sm font-semibold text-amber-800">
                      {previewOption.label}{' '}
                      <span aria-hidden className="text-base leading-none">{previewOption.emoji}</span>
                    </span>
                  ) : null}
                </div>

                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Tap a star to share your review
                </p>
              </div>
            </RateCard>
          </div>
        ) : shop && step === 'private-feedback' ? (
          <div className="animate-fade-up w-full sm:w-auto">
            <RateCard showBack onBack={handleBackToStars}>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <MessageSquareLock className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </div>
                <h1 className="mt-5 font-display text-[1.55rem] font-bold tracking-tight text-ink sm:text-[1.7rem]">
                  Tell us what happened
                </h1>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  Your feedback stays private with {shop.name}. It never posts to Google.
                </p>
              </div>
              <form className="mt-6" onSubmit={(e) => void handleSubmitPrivateFeedback(e)}>
                <label htmlFor="private-feedback" className="sr-only">Private feedback</label>
                <textarea
                  id="private-feedback"
                  value={privateFeedbackText}
                  onChange={(e) => {
                    setPrivateFeedbackText(e.target.value);
                    if (privateFeedbackError) setPrivateFeedbackError(null);
                  }}
                  rows={5}
                  maxLength={2000}
                  required
                  placeholder="What could have been better?"
                  className="w-full resize-y rounded-2xl border border-line bg-white px-4 py-3.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
                {privateFeedbackError ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">{privateFeedbackError}</p>
                ) : null}
                <button type="submit" disabled={submittingFeedback} className="btn-gradient mt-4 w-full">
                  {submittingFeedback ? 'Sending…' : 'Send feedback'}
                </button>
              </form>
            </RateCard>
          </div>
        ) : shop && step === 'thank-you' ? (
          <div className="animate-fade-up w-full sm:w-auto">
            <RateCard>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <CheckCircle2 className="h-8 w-8" aria-hidden />
                </div>
                <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">Thank you</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Honest feedback like this helps {shop.name} improve and serve you better next time.
                </p>
              </div>
            </RateCard>
          </div>
        ) : shop && step === 'generating' ? (
          <div className="animate-fade-up w-full sm:w-auto">
            <RateCard showBack onBack={handleBackToStars}>
              <div className="flex flex-col items-center py-6 text-center">
                <Loader2 className="h-14 w-14 animate-spin text-brand" aria-hidden />
                <p key={messageIndex} className="mt-6 min-h-14 text-[15px] leading-relaxed text-muted" aria-live="polite">
                  {GENERATING_MESSAGES[messageIndex]}
                </p>
              </div>
            </RateCard>
          </div>
        ) : shop && step === 'suggestions' ? (
          <div className="animate-fade-up flex h-dvh min-h-0 w-full flex-col sm:h-auto sm:w-auto">
            <RateCard showBack onBack={handleBackToStars} fill>
              <p className="flex shrink-0 items-center justify-center gap-2 text-center text-sm font-bold text-ink">
                <Sparkles className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Select a review to copy and post on Google
              </p>
              {suggestionsError ? (
                <div className="mt-8 text-center">
                  <p className="text-sm text-red-600">{suggestionsError}</p>
                  <button
                    type="button"
                    className="btn-gradient mt-4 px-4 py-2.5"
                    onClick={() => selected && void generateSuggestions(selected)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2 sm:max-h-[68dvh] sm:flex-none">
                    <div className="flex flex-col gap-3 pb-1">
                      {suggestions.map((text, index) => {
                        const isSelected = index === selectedSuggestionIndex;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedSuggestionIndex(index)}
                            className={`w-full rounded-2xl border bg-paper px-4 py-4 text-left transition-colors ${
                              isSelected ? 'border-brand shadow-sm' : 'border-line hover:border-brand/30'
                            }`}
                          >
                            <p className="text-sm leading-relaxed text-ink sm:text-[15px]">{text}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="shrink-0 pt-4">
                    {shop.googleReviewUrl ? (
                      <button type="button" onClick={() => void handleCopyAndOpenGoogle()} className="btn-gradient w-full">
                        Copy and open Google
                        <span aria-hidden className="ml-1">→</span>
                      </button>
                    ) : (
                      <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                        Google review link is not set up for this shop yet.
                      </p>
                    )}
                    {shop.googleReviewUrl ? (
                      <button
                        type="button"
                        onClick={handleWriteOwn}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 bg-transparent text-sm text-muted transition-colors hover:text-brand"
                      >
                        Write my own review instead
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </RateCard>
          </div>
        ) : null}
      </main>
    </div>
  );
}

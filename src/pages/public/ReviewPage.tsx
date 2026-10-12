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
  reviewQuestions: string[];
  answerOptions?: string[];
};

type Step = 'rating' | 'questions' | 'generating' | 'draft' | 'private-feedback' | 'thank-you';

type DraftAnswer = { question: string; answer: string };

const RATING_OPTIONS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Terrible', emoji: '😢' },
  2: { label: 'Okay', emoji: '😐' },
  3: { label: 'Happy', emoji: '😊' },
  4: { label: 'Very Good', emoji: '😄' },
  5: { label: 'Excellent', emoji: '🤩' },
};

const GENERATING_MESSAGES = [
  'Turning your answers into a Google review you can edit…',
  'Reviews like yours help other customers make wise decisions.',
  'Your feedback shines a light for people discovering this place.',
  'Honest voices like yours help great businesses get noticed.',
];

const DEFAULT_REVIEW_QUESTIONS = [
  'What did you enjoy most about your visit?',
  'Was there anything that stood out? (staff, ambiance, service…)',
  'Who would you recommend us to?',
];

const DEFAULT_ANSWER_OPTIONS = [
  'Friendly staff',
  'Great food',
  'Ambience',
  'Fast service',
  'Clean place',
  'Good value',
];

const SUBSCRIPTION_UNAVAILABLE_TITLE = 'No Subscription!';

function fallbackDrafts(name: string, stars: number, highlight?: string): string[] {
  const bit = highlight?.trim() || 'great service';
  return [
    `Had a ${stars}-star experience at ${name}. ${bit}. Would recommend to friends and family.`,
    `${name} exceeded my expectations — ${bit}. Friendly team and great service.`,
    `Really pleased with my visit to ${name}. ${bit}. Professional and worth every rupee.`,
  ];
}

function buildDraftAnswers(questions: string[], answers: string[]): DraftAnswer[] {
  return questions
    .map((question, index) => ({ question, answer: answers[index]?.trim() ?? '' }))
    .filter((row) => row.answer.length >= 2);
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
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [draftVersions, setDraftVersions] = useState<string[]>([]);
  const [activeWording, setActiveWording] = useState(0);
  const [draftError, setDraftError] = useState<string | null>(null);
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

  const activeQuestions =
    shop?.reviewQuestions?.length ? shop.reviewQuestions : DEFAULT_REVIEW_QUESTIONS;

  const answerOptions =
    shop?.answerOptions?.length ? shop.answerOptions : DEFAULT_ANSWER_OPTIONS;

  async function generateDraft(starRating: number) {
    if (!shop) return;
    const answers = buildDraftAnswers(activeQuestions, questionAnswers);
    if (!answers.length) {
      setDraftError('Please answer at least one question.');
      return;
    }
    setStep('generating');
    setDraftError(null);
    setDraftVersions([]);
    setActiveWording(0);
    try {
      const data = await api<{ suggestions: string[] }>(
        `/api/public/r/${encodeURIComponent(code)}/suggestions`,
        { method: 'POST', auth: false, body: { stars: starRating, answers } },
      );
      const list = data.suggestions.length
        ? data.suggestions
        : fallbackDrafts(shop.name, starRating, answers[0]?.answer);
      setDraftVersions(list);
      setStep('draft');
    } catch (err) {
      const fallback = fallbackDrafts(shop.name, starRating, answers[0]?.answer);
      setDraftError(err instanceof Error ? err.message : 'Could not generate your review.');
      setDraftVersions(fallback);
      setStep('draft');
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
    const questions =
      shop.reviewQuestions?.length ? shop.reviewQuestions : DEFAULT_REVIEW_QUESTIONS;
    setQuestionAnswers(questions.map(() => ''));
    setDraftError(null);
    setStep('questions');
  }

  function handleSubmitQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    void generateDraft(selected);
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
    if (!shop || !draftText.trim()) return;
    const text = draftText.trim();
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
    setQuestionAnswers([]);
    setDraftVersions([]);
    setActiveWording(0);
    setDraftError(null);
    setPrivateFeedbackText('');
    setPrivateFeedbackError(null);
    setHovered(0);
  }

  function handleBackToQuestions() {
    setStep('questions');
    setDraftVersions([]);
    setActiveWording(0);
    setDraftError(null);
  }

  function parsedAnswerOptions(value: string): string[] {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function isAnswerOptionSelected(value: string, option: string): boolean {
    const key = option.toLowerCase();
    return parsedAnswerOptions(value).some((part) => part.toLowerCase() === key);
  }

  function toggleAnswerOption(questionIndex: number, option: string) {
    const next = [...questionAnswers];
    const parts = parsedAnswerOptions(next[questionIndex] ?? '');
    const key = option.toLowerCase();
    const existing = parts.findIndex((part) => part.toLowerCase() === key);
    if (existing >= 0) parts.splice(existing, 1);
    else parts.push(option);
    next[questionIndex] = parts.join(', ');
    setQuestionAnswers(next);
    if (draftError) setDraftError(null);
  }

  const draftText = draftVersions[activeWording] ?? '';

  function updateDraftText(text: string) {
    setDraftVersions((prev) => {
      const next = prev.length ? [...prev] : [''];
      next[activeWording] = text;
      return next;
    });
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
        ) : shop && step === 'questions' ? (
          <div className="animate-fade-up w-full sm:w-auto">
            <RateCard showBack onBack={handleBackToStars}>
              <div className="text-center">
                <h1 className="font-display text-[1.55rem] font-bold tracking-tight text-ink sm:text-[1.7rem]">
                  Help us write your review
                </h1>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  Answer a few quick questions — we&apos;ll draft a Google review you can edit.
                </p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmitQuestions(e)}>
                {activeQuestions.map((question, index) => (
                  <div key={index}>
                    <label className="block text-sm font-semibold text-ink" htmlFor={`review-q-${index}`}>
                      {question}
                      {index === 0 ? null : (
                        <span className="font-normal text-muted"> (optional)</span>
                      )}
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Tap to select">
                      {answerOptions.map((option) => {
                        const selected = isAnswerOptionSelected(
                          questionAnswers[index] ?? '',
                          option,
                        );
                        return (
                          <button
                            key={`${index}-${option}`}
                            type="button"
                            onClick={() => toggleAnswerOption(index, option)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              selected
                                ? 'border-brand bg-brand/10 text-brand'
                                : 'border-line bg-white text-muted hover:border-brand hover:text-brand'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      id={`review-q-${index}`}
                      type="text"
                      maxLength={500}
                      value={questionAnswers[index] ?? ''}
                      onChange={(e) => {
                        const next = [...questionAnswers];
                        next[index] = e.target.value;
                        setQuestionAnswers(next);
                        if (draftError) setDraftError(null);
                      }}
                      className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
                      placeholder={index === 0 ? 'Or type your own…' : 'Add more detail (optional)'}
                      required={index === 0 && !parsedAnswerOptions(questionAnswers[index] ?? '').length}
                    />
                  </div>
                ))}
                {draftError ? (
                  <p className="text-sm text-red-600" role="alert">{draftError}</p>
                ) : null}
                <button type="submit" className="btn-gradient w-full">
                  Create my review
                  <Sparkles className="ml-1.5 inline h-4 w-4" aria-hidden />
                </button>
              </form>
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
            <RateCard showBack onBack={handleBackToQuestions}>
              <div className="flex flex-col items-center py-6 text-center">
                <Loader2 className="h-14 w-14 animate-spin text-brand" aria-hidden />
                <p key={messageIndex} className="mt-6 min-h-14 text-[15px] leading-relaxed text-muted" aria-live="polite">
                  {GENERATING_MESSAGES[messageIndex]}
                </p>
              </div>
            </RateCard>
          </div>
        ) : shop && step === 'draft' ? (
          <div className="animate-fade-up flex h-dvh min-h-0 w-full flex-col sm:h-auto sm:w-auto">
            <RateCard showBack onBack={handleBackToQuestions} fill>
              <p className="flex shrink-0 items-center justify-center gap-2 text-center text-sm font-bold text-ink">
                <Sparkles className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                Edit your review, then post on Google
              </p>
              {draftError ? (
                <p className="mt-3 text-center text-sm text-amber-800">{draftError}</p>
              ) : null}
              <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <label htmlFor="google-review-draft" className="sr-only">Google review draft</label>
                <textarea
                  id="google-review-draft"
                  value={draftText}
                  onChange={(e) => updateDraftText(e.target.value)}
                  rows={6}
                  maxLength={4000}
                  className="min-h-[10rem] w-full flex-1 resize-y rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm leading-relaxed text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
                {draftVersions.length > 1 ? (
                  <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Review wording">
                    {draftVersions.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        role="tab"
                        aria-selected={activeWording === index}
                        onClick={() => setActiveWording(index)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          activeWording === index
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-line bg-white text-muted hover:border-brand hover:text-brand'
                        }`}
                      >
                        Wording {index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="shrink-0 space-y-3 pt-4">
                  <button
                    type="button"
                    onClick={() => selected && void generateDraft(selected)}
                    className="w-full rounded-xl border border-line bg-white py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand"
                  >
                    Regenerate from my answers
                  </button>
                  {shop.googleReviewUrl ? (
                    <button
                      type="button"
                      disabled={!draftText.trim()}
                      onClick={() => void handleCopyAndOpenGoogle()}
                      className="btn-gradient w-full disabled:opacity-50"
                    >
                      Copy and open Google
                      <span aria-hidden className="ml-1">→</span>
                    </button>
                  ) : (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      Google review link is not set up for this shop yet.
                    </p>
                  )}
                  <p className="text-center text-xs text-muted">
                    On Google: paste your text (long-press → Paste) and choose your stars.
                  </p>
                  {shop.googleReviewUrl ? (
                    <button
                      type="button"
                      onClick={handleWriteOwn}
                      className="flex w-full items-center justify-center gap-1.5 bg-transparent text-sm text-muted transition-colors hover:text-brand"
                    >
                      Open Google without copying
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
            </RateCard>
          </div>
        ) : null}
      </main>
    </div>
  );
}

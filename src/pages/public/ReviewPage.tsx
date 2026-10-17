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
  answerOptionsPerQuestion?: string[][];
};

type Step = 'rate' | 'generating' | 'draft' | 'thank-you';

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
  'What did we do well for you?',
  'What mattered most about your experience? (optional)',
  'Who would you recommend us to? (optional)',
];

const DEFAULT_ANSWER_OPTIONS_BY_QUESTION = [
  ['Clear communication', 'Quality work', 'Friendly team'],
  ['On time', 'Fair pricing', 'Easy process'],
  ['Friends & family', 'Colleagues', 'Anyone nearby'],
];

const SUBSCRIPTION_UNAVAILABLE_TITLE = 'No Subscription!';

function fallbackDrafts(name: string, stars: number, highlight?: string): string[] {
  const phrases = (highlight ?? '')
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  const a = phrases[0] ?? 'great service';
  const b = phrases[1] ?? a;
  return [
    `${stars} stars at ${name} — ${a} really made the difference for me.`,
    `I'd recommend ${name}; ${b.toLowerCase()} was handled better than I expected.`,
  ];
}

function buildDraftAnswers(questions: string[], answers: string[]): DraftAnswer[] {
  return questions
    .map((question, index) => ({ question, answer: answers[index]?.trim() ?? '' }))
    .filter((row) => row.answer.length >= 2);
}

function questionShowsOptionalSuffix(question: string): boolean {
  return !/\(optional\)/i.test(question);
}

export function ReviewPage() {
  const { code = '' } = useParams();
  const [shop, setShop] = useState<PublicReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState('Unavailable');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('rate');
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

  function chipsForQuestion(index: number): string[] {
    const fromApi = shop?.answerOptionsPerQuestion?.[index];
    if (fromApi?.length) return fromApi;
    const fallback =
      DEFAULT_ANSWER_OPTIONS_BY_QUESTION[index] ??
      DEFAULT_ANSWER_OPTIONS_BY_QUESTION[index % DEFAULT_ANSWER_OPTIONS_BY_QUESTION.length];
    return [...fallback];
  }

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
      const list = (data.suggestions.length ? data.suggestions : fallbackDrafts(shop.name, starRating, answers[0]?.answer)).slice(
        0,
        2,
      );
      setDraftVersions(list);
      setStep('draft');
    } catch (err) {
      const fallback = fallbackDrafts(shop.name, starRating, answers[0]?.answer);
      setDraftError(err instanceof Error ? err.message : 'Could not generate your review.');
      setDraftVersions(fallback.slice(0, 2));
      setStep('draft');
    }
  }

  function handleSelectRating(value: number) {
    if (!shop || step !== 'rate') return;
    const prev = selected;
    setSelected(value);
    void record('star', { stars: value }).catch(() => {
      /* still advance UX */
    });
    if (value <= 3) {
      if (prev >= 4) setQuestionAnswers([]);
      setPrivateFeedbackError(null);
      setDraftError(null);
      return;
    }
    if (prev <= 3 || !questionAnswers.length) {
      const questions =
        shop.reviewQuestions?.length ? shop.reviewQuestions : DEFAULT_REVIEW_QUESTIONS;
      setQuestionAnswers(questions.map(() => ''));
    }
    setPrivateFeedbackText('');
    setPrivateFeedbackError(null);
    setDraftError(null);
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

  function handleBackToRate() {
    setStep('rate');
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

  const activeRating = hovered || selected;
  const previewOption = hovered
    ? RATING_OPTIONS[hovered]
    : selected
      ? RATING_OPTIONS[selected]
      : null;
  const expandedRateStep = step === 'rate' && selected > 0;
  const questionsOpen = expandedRateStep && selected >= 4;
  const privateFeedbackOpen = expandedRateStep && selected >= 1 && selected <= 3;

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
        ) : shop && step === 'rate' ? (
          <div
            className={`animate-fade-up w-full sm:w-auto ${
              expandedRateStep ? 'flex h-dvh min-h-0 flex-col' : ''
            }`}
          >
            <RateCard
              alignTop={expandedRateStep}
              fill={expandedRateStep}
              compact={expandedRateStep}
              hideFooter={expandedRateStep}
            >
              <div className={`text-center ${expandedRateStep ? 'shrink-0' : ''}`}>
                <h1
                  className={`font-display font-bold leading-tight tracking-tight text-ink ${
                    expandedRateStep
                      ? 'text-lg sm:text-xl'
                      : 'text-[1.65rem] sm:text-[1.85rem]'
                  }`}
                >
                  {shop.name}
                </h1>
                {!expandedRateStep && shop.address ? (
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{shop.address}</p>
                ) : !expandedRateStep ? (
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    How was your experience with us today?
                  </p>
                ) : null}

                {expandedRateStep ? (
                  <div
                    className={`flex items-center justify-center gap-2 ${privateFeedbackOpen ? 'mt-1' : 'mt-2'}`}
                    onMouseLeave={() => setHovered(0)}
                    role="radiogroup"
                    aria-label="Star rating"
                  >
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const filled = value <= activeRating;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={selected === value}
                            aria-label={`${value} stars — ${RATING_OPTIONS[value].label}`}
                            className="rounded-lg p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
                            onMouseEnter={() => setHovered(value)}
                            onFocus={() => setHovered(value)}
                            onBlur={() => setHovered(0)}
                            onClick={() => handleSelectRating(value)}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                filled
                                  ? 'fill-gold text-gold'
                                  : 'fill-transparent text-slate-300'
                              }`}
                              strokeWidth={1.5}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {previewOption ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800"
                        aria-live="polite"
                      >
                        {previewOption.label}
                        <span aria-hidden className="leading-none">{previewOption.emoji}</span>
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <>
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

                    {!selected ? (
                      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Tap a star to share your review
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {selected >= 1 && selected <= 3 ? (
                <form
                  className={`border-t border-line ${
                    privateFeedbackOpen
                      ? 'mt-2 flex min-h-0 flex-1 flex-col pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
                      : expandedRateStep
                        ? 'mt-3 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
                        : 'mt-8 pt-6'
                  }`}
                  onSubmit={(e) => void handleSubmitPrivateFeedback(e)}
                >
                  <div className={`text-center ${privateFeedbackOpen ? 'shrink-0' : ''}`}>
                    <div
                      className={`mx-auto flex items-center justify-center rounded-full bg-brand/10 text-brand ${
                        privateFeedbackOpen ? 'h-10 w-10' : 'h-14 w-14'
                      }`}
                    >
                      <MessageSquareLock
                        className={privateFeedbackOpen ? 'h-5 w-5' : 'h-6 w-6'}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                    <h2
                      className={`font-display font-bold tracking-tight text-ink ${
                        privateFeedbackOpen ? 'mt-2 text-base' : 'mt-4 text-lg'
                      }`}
                    >
                      Private feedback
                    </h2>
                    <p
                      className={`text-muted ${
                        privateFeedbackOpen
                          ? 'mt-1 text-xs leading-snug'
                          : 'mt-2 text-sm leading-relaxed'
                      }`}
                    >
                      Only {shop.name} sees this — nothing posts to Google.
                    </p>
                  </div>
                  <label htmlFor="private-feedback" className="sr-only">Private feedback</label>
                  <textarea
                    id="private-feedback"
                    value={privateFeedbackText}
                    onChange={(e) => {
                      setPrivateFeedbackText(e.target.value);
                      if (privateFeedbackError) setPrivateFeedbackError(null);
                    }}
                    rows={privateFeedbackOpen ? 2 : 4}
                    maxLength={2000}
                    required
                    placeholder="What could have been better?"
                    className={`w-full rounded-2xl border border-line bg-white px-4 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 ${
                      privateFeedbackOpen
                        ? 'mt-2 min-h-[4.5rem] flex-1 resize-none py-2.5'
                        : 'mt-4 resize-y py-3.5'
                    }`}
                  />
                  {privateFeedbackError ? (
                    <p className="mt-1 shrink-0 text-sm text-red-600" role="alert">{privateFeedbackError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className={`btn-gradient w-full shrink-0 ${privateFeedbackOpen ? 'mt-2' : 'mt-4'}`}
                  >
                    {submittingFeedback ? 'Sending…' : 'Send feedback'}
                  </button>
                </form>
              ) : null}

              {selected >= 4 ? (
                <form
                  className="mt-3 border-t border-line pt-3 space-y-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                  onSubmit={(e) => void handleSubmitQuestions(e)}
                >
                  <h2 className="text-center font-display text-base font-bold tracking-tight text-ink">
                    A few quick questions
                  </h2>
                  {activeQuestions.map((question, index) => (
                    <div key={index}>
                      <label className="block text-xs font-semibold text-ink" htmlFor={`review-q-${index}`}>
                        {question}
                        {index > 0 && questionShowsOptionalSuffix(question) ? (
                          <span className="font-normal text-muted"> (optional)</span>
                        ) : null}
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label="Tap to select">
                        {chipsForQuestion(index).map((option) => {
                          const chipSelected = isAnswerOptionSelected(
                            questionAnswers[index] ?? '',
                            option,
                          );
                          return (
                            <button
                              key={`${index}-${option}`}
                              type="button"
                              onClick={() => toggleAnswerOption(index, option)}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                chipSelected
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
                        className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
                        placeholder={index === 0 ? 'Or type your own…' : 'Add more detail (optional)'}
                        required={index === 0 && !parsedAnswerOptions(questionAnswers[index] ?? '').length}
                      />
                    </div>
                  ))}
                  {draftError ? (
                    <p className="text-xs text-red-600" role="alert">{draftError}</p>
                  ) : null}
                  <button type="submit" className="btn-gradient w-full py-2.5 text-sm">
                    Frame my review
                    <Sparkles className="ml-1.5 inline h-3.5 w-3.5" aria-hidden />
                  </button>
                </form>
              ) : null}
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
            <RateCard showBack onBack={handleBackToRate}>
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
            <RateCard showBack onBack={handleBackToRate} fill alignTop>
              <div className="shrink-0 text-center">
                <p className="flex items-center justify-center gap-2 text-sm font-bold text-ink">
                  <Sparkles className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  Pick a review to copy
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Each option is worded differently — tap one, then paste on Google.
                </p>
              </div>
              {draftError ? (
                <p className="mt-3 shrink-0 text-center text-sm text-amber-800">{draftError}</p>
              ) : null}
              <div
                className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2"
                role="radiogroup"
                aria-label="Review drafts"
              >
                {draftVersions.map((text, index) => {
                  const picked = activeWording === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      role="radio"
                      aria-checked={picked}
                      onClick={() => setActiveWording(index)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        picked
                          ? 'border-brand bg-brand/5 ring-2 ring-brand/25'
                          : 'border-line bg-white hover:border-brand/40'
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        Option {index + 1}
                      </span>
                      <p className="mt-2 text-sm leading-relaxed text-ink">{text}</p>
                    </button>
                  );
                })}
              </div>
              <div className="shrink-0 space-y-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => selected && void generateDraft(selected)}
                  className="w-full rounded-xl border border-line bg-white py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand"
                >
                  New wordings
                </button>
                {shop.googleReviewUrl ? (
                  <button
                    type="button"
                    disabled={!draftText.trim()}
                    onClick={() => void handleCopyAndOpenGoogle()}
                    className="btn-gradient w-full disabled:opacity-50"
                  >
                    Copy selected &amp; open Google
                    <span aria-hidden className="ml-1">→</span>
                  </button>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    Google review link is not set up for this shop yet.
                  </p>
                )}
                <p className="text-center text-xs text-muted">
                  On Google: long-press the box → Paste, then post with your stars.
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
            </RateCard>
          </div>
        ) : null}
      </main>
    </div>
  );
}

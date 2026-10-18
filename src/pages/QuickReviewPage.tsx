import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  MapPin,
  Plus,
  Printer,
  Trash2,
  User,
} from 'lucide-react';
import { LockedQrGate } from '../components/LockedQrGate';
import { QrCodePreview } from '../components/QrCodePreview';
import { ReviewGrowthCard, type ReviewGrowthData } from '../components/review/ReviewGrowthCard';
import { ReviewGuestPreview } from '../components/review/ReviewGuestPreview';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';

type Tab = 'qr' | 'stats' | 'inbox' | 'settings';
type InboxFilter = 'open' | 'resolved' | 'all';
type ReviewTone = 'friendly' | 'professional' | 'short';

type Summary = {
  reviewCode: string;
  publicPath: string;
  publicUrl: string;
  googlePlaceId: string | null;
  googleReviewUrl: string | null;
  reviewUnlocked: boolean;
  reviewAccess: {
    unlocked: boolean;
    status: string;
    endDate: string | null;
  };
  aiKeywords: string[];
  aiReviewQuestions: string[];
  guestReviewQuestions: string[];
  businessCategory: string | null;
  suggestedReviewAi: {
    label: string;
    questions: string[];
    keywords: string[];
  };
  stats: {
    pageViews: number;
    stars: number;
    privateFeedback: number;
    googleOpens: number;
  };
};

type InboxItem = {
  id: string;
  stars: number | null;
  message: string | null;
  createdAt: string;
};

function inboxForFilter(items: InboxItem[], filter: InboxFilter): InboxItem[] {
  if (filter === 'resolved') return [];
  return items;
}

const BTN_SECONDARY =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand/30';
const BTN_PRIMARY =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark';

function formatInboxWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function downloadQrPng(container: HTMLElement | null, filename: string) {
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const serialized = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const svgUrl = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }));
  img.onload = () => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
    URL.revokeObjectURL(svgUrl);
  };
  img.src = svgUrl;
}

function InboxStars({ stars }: { stars: number }) {
  const value = Math.min(5, Math.max(0, stars));
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <span
            key={n}
            className={`text-lg leading-none ${filled ? 'text-orange-400' : 'text-slate-200'}`}
            aria-hidden
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

function buildTabs(openInbox: number): { id: Tab; label: string }[] {
  return [
    { id: 'qr', label: 'QR & link' },
    { id: 'stats', label: 'Analytics' },
    { id: 'inbox', label: openInbox > 0 ? `Inbox (${openInbox})` : 'Inbox' },
    { id: 'settings', label: 'AI settings' },
  ];
}

export function QuickReviewPage() {
  const { selected } = useLocationContext();
  const [tab, setTab] = useState<Tab>('qr');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [reviewTone, setReviewTone] = useState<ReviewTone>('friendly');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [statsRange, setStatsRange] = useState<'7' | '30' | '90' | 'all'>('30');
  const [reviewGrowth, setReviewGrowth] = useState<ReviewGrowthData | null>(null);
  const [reviewGrowthError, setReviewGrowthError] = useState<string | null>(null);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('open');
  const [linkCopied, setLinkCopied] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) {
      setSummary(null);
      setInbox([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [hub, items] = await Promise.all([
          api<Summary>(`/api/locations/${selected.id}/quickreview`),
          api<InboxItem[]>(`/api/locations/${selected.id}/inbox`),
        ]);
        if (!cancelled) {
          setSummary(hub);
          setInbox(items);
          const qs =
            (hub.aiReviewQuestions?.length ? hub.aiReviewQuestions : hub.guestReviewQuestions) ?? [];
          setQuestions(qs.length ? [...qs] : ['What did you like most about working with us?']);
          setKeywords([...(hub.aiKeywords ?? [])]);
          setError(null);
          setSettingsMsg(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load QuickReview');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected || tab !== 'stats') {
      setReviewGrowth(null);
      setReviewGrowthError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const growth = await api<ReviewGrowthData>(
          `/api/locations/${selected.id}/quickreview/review-growth?range=${statsRange}`,
        );
        if (!cancelled) {
          setReviewGrowth(growth);
          setReviewGrowthError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setReviewGrowth(null);
          setReviewGrowthError(err instanceof ApiError ? err.message : 'Could not load review growth');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, tab, statsRange]);

  const filteredInbox = inboxForFilter(inbox, inboxFilter);

  function resetSettingsDraft() {
    if (!summary) return;
    const qs =
      (summary.aiReviewQuestions?.length ? summary.aiReviewQuestions : summary.guestReviewQuestions) ??
      [];
    setQuestions(qs.length ? [...qs] : ['What did you like most about working with us?']);
    setKeywords([...(summary.aiKeywords ?? [])]);
    setKeywordDraft('');
    setSettingsMsg(null);
  }

  async function saveAiSettings() {
    if (!selected) return;
    const reviewQuestions = questions.map((q) => q.trim()).filter(Boolean);
    try {
      await api(`/api/locations/${selected.id}/quickreview/settings`, {
        method: 'PATCH',
        body: { keywords, reviewQuestions },
      });
      const hub = await api<Summary>(`/api/locations/${selected.id}/quickreview`);
      setSummary(hub);
      const qs =
        (hub.aiReviewQuestions?.length ? hub.aiReviewQuestions : hub.guestReviewQuestions) ?? [];
      setQuestions(qs.length ? [...qs] : questions);
      setKeywords([...(hub.aiKeywords ?? [])]);
      setSettingsMsg('AI settings saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save AI settings');
    }
  }

  async function copyReviewLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
    }
  }

  const unlocked = summary?.reviewUnlocked ?? false;
  const pageViews = summary?.stats.pageViews ?? 0;
  const googleOpens = summary?.stats.googleOpens ?? 0;
  const privateFeedback = summary?.stats.privateFeedback ?? 0;
  const googlePct = pageViews > 0 ? Math.round((googleOpens / pageViews) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">QuickReview</h1>
            {selected && summary && unlocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Happy guests (4–5★) get an AI-drafted Google review. Unhappy guests (1–3★) reach your private
            inbox instead.
          </p>
        </div>
      </div>

      {!selected ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-6 text-center">
          <p className="font-semibold">Pick a location first</p>
          <p className="mt-1 text-sm text-muted">Import your shop from Google on the Dashboard.</p>
          <Link to="/app" className={`mt-4 ${BTN_PRIMARY}`}>
            Go to Dashboard
          </Link>
        </div>
      ) : null}

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && summary ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
          <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="QuickReview sections">
            {buildTabs(inbox.length).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold ${
                  tab === item.id
                    ? 'border-brand text-brand-dark'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {tab === 'qr' ? (
            <div className="mt-6 space-y-5">
              {!unlocked ? (
                <LockedQrGate className="max-w-lg" />
              ) : (
                <>
                  <article className="overflow-hidden rounded-2xl border-2 border-brand/40 bg-white shadow-sm">
                    <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start">
                      <div
                        ref={qrWrapRef}
                        className="flex shrink-0 justify-center rounded-xl border border-line bg-white p-3 sm:w-44"
                      >
                        <QrCodePreview value={summary.publicUrl} size={148} label="Review QR code" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold">Your review QR &amp; link</h2>
                        <p className="mt-1 text-sm text-muted">
                          Print it on standees and bills, or share the link on WhatsApp and SMS.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <input
                            readOnly
                            value={summary.publicUrl.replace(/^https?:\/\//, '')}
                            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 font-mono text-sm"
                            aria-label="Review link"
                          />
                          <button
                            type="button"
                            onClick={() => void copyReviewLink(summary.publicUrl)}
                            className={BTN_PRIMARY}
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {linkCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={BTN_SECONDARY}
                            onClick={() => downloadQrPng(qrWrapRef.current, 'review-qr')}
                          >
                            <Download className="h-4 w-4" />
                            Download PNG
                          </button>
                          <Link to="/app/marketplace" className={BTN_SECONDARY}>
                            <Printer className="h-4 w-4" />
                            Print standee
                          </Link>
                          <a href={summary.publicPath} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>
                            <ExternalLink className="h-4 w-4" />
                            Open guest page
                          </a>
                        </div>
                        <Link
                          to="/app/qr"
                          className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                        >
                          Manage all QR codes &amp; standees →
                        </Link>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-line bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted" aria-hidden />
                          <h2 className="font-bold">Google review link</h2>
                        </div>
                        <p className="mt-0.5 text-sm text-muted">Where 4–5★ guests are sent to post</p>
                      </div>
                      {summary.googleReviewUrl ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          <Check className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Business</span>
                        <input
                          readOnly
                          value={selected.businessName}
                          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Place ID</span>
                        <input
                          readOnly
                          value={summary.googlePlaceId ?? '—'}
                          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5 font-mono text-xs"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {summary.googleReviewUrl ? (
                        <a
                          href={summary.googleReviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={BTN_SECONDARY}
                        >
                          Test link
                        </a>
                      ) : null}
                      <Link
                        to={`/app/businesses/${selected.businessId}`}
                        className={summary.googleReviewUrl ? BTN_SECONDARY : BTN_PRIMARY}
                      >
                        Change business
                      </Link>
                    </div>
                  </article>

                  <section>
                    <h2 className="font-bold">How guests are routed</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4">
                        <p className="font-bold text-red-900">1–3★ · Private</p>
                        <p className="mt-1 text-sm text-red-900/80">
                          Guest writes what went wrong. It lands in your Inbox — never on Google.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                        <p className="font-bold text-emerald-900">4–5★ · Public</p>
                        <p className="mt-1 text-sm text-emerald-900/80">
                          Guest answers 2–3 questions, AI drafts the review, guest edits and posts on Google.
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : null}

          {!unlocked && tab !== 'qr' ? (
            <p className="mt-4 text-sm text-muted">
              Review page is locked —{' '}
              <Link to="/app/subscription" className="font-semibold text-brand">select a plan</Link> on the QR
              &amp; link tab.
            </p>
          ) : null}

          {tab === 'stats' && unlocked ? (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold">Performance</h2>
                <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1 text-xs font-semibold">
                  {(
                    [
                      ['7', '7 days'],
                      ['30', '30 days'],
                      ['90', '90 days'],
                      ['all', 'All time'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStatsRange(id)}
                      className={`rounded-lg px-2.5 py-1.5 ${
                        statsRange === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Page views', value: pageViews, hint: 'QR scans + link opens' },
                  {
                    label: 'Google opens',
                    value: googleOpens,
                    hint: `${googlePct}% of views`,
                    accent: 'text-emerald-600',
                  },
                  {
                    label: 'Private feedback',
                    value: privateFeedback,
                    hint: 'Kept off Google',
                    accent: 'text-red-600',
                  },
                  { label: 'Star taps', value: summary.stats.stars, hint: 'Includes changed ratings' },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-line bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                    <p className={`mt-2 text-3xl font-extrabold tabular-nums ${card.accent ?? ''}`}>
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-muted">{card.hint}</p>
                  </div>
                ))}
              </div>

              <article className="rounded-2xl border border-line bg-white p-5">
                <h3 className="font-bold">Guest funnel</h3>
                <p className="text-sm text-muted">Out of every guest who opened your page</p>
                <ul className="mt-5 space-y-4">
                  {[
                    { label: 'Opened review page', value: pageViews, pct: 100, bar: 'bg-ink' },
                    {
                      label: 'Went to Google (4–5★)',
                      value: googleOpens,
                      pct: pageViews > 0 ? (googleOpens / pageViews) * 100 : 0,
                      bar: 'bg-brand',
                    },
                    {
                      label: 'Sent private feedback (1–3★)',
                      value: privateFeedback,
                      pct: pageViews > 0 ? (privateFeedback / pageViews) * 100 : 0,
                      bar: 'bg-orange-400',
                    },
                  ].map((row) => (
                    <li key={row.label}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold">{row.label}</span>
                        <span className="tabular-nums text-muted">
                          {row.pct < 100 && row.pct > 0 ? `${row.pct % 1 === 0 ? row.pct : row.pct.toFixed(1)}%` : row.pct === 100 ? '100%' : `${row.pct % 1 === 0 ? row.pct : row.pct.toFixed(1)}%`}{' '}
                          <span className="font-bold text-ink">· {row.value}</span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
                        <div
                          className={`h-full rounded-full ${row.bar}`}
                          style={{ width: `${Math.min(100, row.pct)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              {reviewGrowthError ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{reviewGrowthError}</p>
              ) : null}
              {reviewGrowth ? <ReviewGrowthCard data={reviewGrowth} /> : null}
            </div>
          ) : null}

          {tab === 'inbox' && unlocked ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold">Private feedback</h2>
                <div className="flex flex-wrap gap-1 text-sm font-semibold">
                  {(
                    [
                      ['open', `Open · ${inbox.length}`],
                      ['resolved', 'Resolved · 0'],
                      ['all', `All · ${inbox.length}`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setInboxFilter(id)}
                      className={`rounded-full px-3 py-1.5 ${
                        inboxFilter === id ? 'bg-ink text-white' : 'border border-line bg-white text-ink'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredInbox.length === 0 ? (
                <p className="mt-6 text-sm text-muted">No private feedback in this view yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {filteredInbox.map((item) => {
                    const stars = item.stars ?? 0;
                    return (
                      <li key={item.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-muted"
                              aria-hidden
                            >
                              <User className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="font-semibold">Anonymous guest</p>
                              <p className="text-xs text-muted">
                                {formatInboxWhen(item.createdAt)} · via QR {summary.reviewCode}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <InboxStars stars={stars} />
                            <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                              Needs reply
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 rounded-xl bg-paper px-3 py-2.5 text-[15px] leading-relaxed text-ink">
                          {item.message?.trim() ? `"${item.message.trim()}"` : '—'}
                        </p>
                        <p className="mt-4 text-xs text-muted">No phone or email left by the guest</p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-4 text-xs text-muted">
                Tip: ask guests for a phone number on the 1–3★ screen so you can call them back.
              </p>
            </div>
          ) : null}

          {tab === 'settings' && unlocked ? (
            <div className="relative mt-6 pb-24">
              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="font-bold">Questions for happy guests (4–5★)</h2>
                <ul className="mt-4 space-y-3">
                  {questions.map((q, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-2.5 w-5 shrink-0 text-sm font-bold text-muted">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <input
                          className="w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                          value={q}
                          onChange={(e) =>
                            setQuestions((prev) => prev.map((row, i) => (i === index ? e.target.value : row)))
                          }
                        />
                        <span
                          className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            index === 0 ? 'bg-brand/10 text-brand-dark' : 'bg-paper text-muted'
                          }`}
                        >
                          {index === 0 ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      {questions.length > 1 ? (
                        <button
                          type="button"
                          className="mt-1 rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"
                          aria-label="Remove question"
                          onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {questions.length < 5 ? (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand"
                    onClick={() => setQuestions((prev) => [...prev, ''])}
                  >
                    <Plus className="h-4 w-4" />
                    Add question
                  </button>
                ) : null}
              </section>

              <section className="mt-5 rounded-2xl border border-line bg-white p-5">
                <h2 className="font-bold">Keywords AI may mention</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {keywords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-sm"
                    >
                      {word}
                      <button
                        type="button"
                        className="text-muted hover:text-ink"
                        aria-label={`Remove ${word}`}
                        onClick={() => setKeywords((prev) => prev.filter((k) => k !== word))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                    placeholder="Type a keyword…"
                    value={keywordDraft}
                    onChange={(e) => setKeywordDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = keywordDraft.trim();
                        if (next && !keywords.includes(next)) setKeywords((prev) => [...prev, next]);
                        setKeywordDraft('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => {
                      const next = keywordDraft.trim();
                      if (next && !keywords.includes(next)) setKeywords((prev) => [...prev, next]);
                      setKeywordDraft('');
                    }}
                  >
                    Add
                  </button>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-line bg-white p-5">
                <h2 className="font-bold">Review tone</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ['friendly', 'Friendly', 'Warm, conversational'],
                      ['professional', 'Professional', 'Polished, to the point'],
                      ['short', 'Short', '1–2 sentences'],
                    ] as const
                  ).map(([id, title, sub]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setReviewTone(id)}
                      className={`rounded-2xl border p-4 text-left ${
                        reviewTone === id ? 'border-brand bg-brand/5' : 'border-line bg-white'
                      }`}
                    >
                      <p className="font-bold">{title}</p>
                      <p className="mt-0.5 text-sm text-muted">{sub}</p>
                    </button>
                  ))}
                </div>
              </section>

              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink px-4 py-3 lg:left-72">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-3">
                  <div className="flex gap-2">
                    <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" onClick={resetSettingsDraft}>
                      Discard
                    </button>
                    <button type="button" className={BTN_PRIMARY} onClick={() => void saveAiSettings()}>
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
              {settingsMsg ? <p className="mt-2 text-sm text-brand-dark">{settingsMsg}</p> : null}
            </div>
          ) : null}
          </div>

          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <ReviewGuestPreview locationName={selected.name} locked={!unlocked} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

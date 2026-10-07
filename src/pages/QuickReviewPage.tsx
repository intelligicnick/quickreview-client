import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, Star } from 'lucide-react';
import { LockedQrGate } from '../components/LockedQrGate';
import { ReviewGuestPreview } from '../components/review/ReviewGuestPreview';
import { QrProductCard } from '../components/QrProductCard';
import { api, ApiError } from '../lib/api';
import { productStatusLabel } from '../lib/location-workspace';
import { useLocationContext } from '../lib/location-context';

type Tab = 'qr' | 'stats' | 'inbox' | 'settings';

type Summary = {
  reviewCode: string;
  publicPath: string;
  publicUrl: string;
  googleReviewUrl: string | null;
  reviewUnlocked: boolean;
  reviewAccess: {
    unlocked: boolean;
    status: string;
    endDate: string | null;
  };
  aiKeywords: string[];
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

const TABS: { id: Tab; label: string }[] = [
  { id: 'qr', label: 'QR & link' },
  { id: 'stats', label: 'Analytics' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'settings', label: 'AI settings' },
];

export function QuickReviewPage() {
  const { selected } = useLocationContext();
  const [tab, setTab] = useState<Tab>('qr');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keywordsText, setKeywordsText] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

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
          setKeywordsText((hub.aiKeywords ?? []).join(', '));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load QuickReview');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function copyLink() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function saveKeywords() {
    if (!selected) return;
    const keywords = keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    try {
      await api(`/api/locations/${selected.id}/quickreview/settings`, {
        method: 'PATCH',
        body: { keywords },
      });
      setSettingsMsg('AI keywords saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save keywords');
    }
  }

  const setupDone = Boolean(summary?.googleReviewUrl);
  const unlocked = summary?.reviewUnlocked ?? false;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">QuickReview</h1>
      <p className="mt-1 text-sm text-muted">
        {selected
          ? `${selected.name} — 1–3★ private inbox, 4–5★ Google review drafts.`
          : 'Select a location to manage your review QR and inbox.'}
      </p>

      {!selected ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-6 text-center">
          <p className="font-semibold">Pick a location first</p>
          <p className="mt-1 text-sm text-muted">Import your shop from Google on the Dashboard.</p>
          <Link
            to="/app"
            className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : null}

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && summary ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
          <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="QuickReview sections">
            {TABS.map((item) => (
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
            <div className="mt-6">
              {!unlocked ? (
                <LockedQrGate className="max-w-lg" />
              ) : (
                <div className="flex flex-wrap gap-4">
                  <QrProductCard
                    title="Review QR"
                    purpose="Guest rating & Google handoff"
                    publicUrl={summary.publicUrl}
                    publicPath={summary.publicPath}
                    unlocked={unlocked}
                    statusLabel={productStatusLabel(unlocked, summary.reviewAccess.status)}
                    manageHref="/app/marketplace"
                    manageLabel="Order standee"
                  />
                  <div className="min-w-[17rem] flex-1 rounded-2xl border border-line bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Review link</p>
                    <p className="mt-2 break-all font-mono text-sm">{summary.publicUrl}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyLink()}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold"
                      >
                        {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy link'}
                      </button>
                      <a
                        href={summary.publicPath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Preview
                      </a>
                    </div>
                    <p className="mt-3 text-xs text-muted">Code {summary.reviewCode}</p>
                    <p className="mt-4 text-sm text-muted">
                      All product QRs:{' '}
                      <Link to="/app/qr" className="font-semibold text-brand">QR codes</Link>
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 min-w-[17rem] max-w-md rounded-2xl border border-line bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Google</p>
                {summary.googleReviewUrl ? (
                  <a
                    href={summary.googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand"
                  >
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    Write-review link ready
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Add Google review URL in{' '}
                    <Link to={`/app/businesses/${selected.businessId}`} className="font-semibold text-brand">
                      business → location
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {!unlocked && tab !== 'qr' ? (
            <p className="mt-4 text-sm text-muted">
              Review page is locked —{' '}
              <Link to="/app/subscription" className="font-semibold text-brand">select a plan</Link> on the QR & link
              tab.
            </p>
          ) : null}

          {tab === 'stats' ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Page views', value: summary.stats.pageViews },
                { label: 'Star taps', value: summary.stats.stars },
                { label: 'Private inbox', value: summary.stats.privateFeedback },
                { label: 'Google opens', value: summary.stats.googleOpens },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-line bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                  <p className="mt-2 text-2xl font-extrabold">{card.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {tab === 'inbox' ? (
            <div className="mt-6">
              {inbox.length === 0 ? (
                <p className="text-sm text-muted">No private feedback yet — 1–3 star ratings land here.</p>
              ) : (
                <ul className="space-y-3">
                  {inbox.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {item.stars} stars · {new Date(item.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm">{item.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'settings' ? (
            <div className="mt-6 max-w-xl rounded-2xl border border-line bg-white p-5">
              <p className="font-bold">AI review keywords</p>
              <p className="mt-1 text-sm text-muted">
                Comma-separated words woven into 4–5 star Google draft suggestions (Gemini when configured).
              </p>
              <input
                className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="biryani, fast service, family friendly"
              />
              <button
                type="button"
                onClick={() => void saveKeywords()}
                className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Save keywords
              </button>
              {settingsMsg ? <p className="mt-2 text-xs text-brand-dark">{settingsMsg}</p> : null}
              <p className="mt-4 text-sm text-muted">
                Setup: {setupDone ? 'Google link connected' : 'add Google review URL'} · keywords power AI drafts
              </p>
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

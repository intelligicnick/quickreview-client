import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { ConnectCardShell } from '../../components/connect/ConnectCardShell';
import { api, ApiError } from '../../lib/api';
import { downloadConnectVCard } from '../../lib/vcard';
import { BrandMark } from '../../components/BrandMark';

type PublicCard = {
  slug: string;
  displayName: string;
  designation: string | null;
  companyName: string | null;
  bio: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  email: string | null;
  coverImageUrl: string | null;
  profileImageUrl: string | null;
  links: Array<{ id: string; type: string; label: string; url: string }>;
};

export function ConnectPage() {
  const { slug = '' } = useParams();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<PublicCard>(`/api/public/c/${encodeURIComponent(slug)}`, { auth: false });
        if (!cancelled) {
          setCard(data);
          setLocked(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 402) setLocked(true);
          setError(err instanceof ApiError ? err.message : 'This card is not available');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/api/public/c/${encodeURIComponent(slug)}/leads`, {
        method: 'POST',
        auth: false,
        body: form,
      });
      setLeadSent(true);
      setForm({ name: '', phone: '', email: '', note: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send — try again');
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <BrandMark className="h-8" />
        <p className="mt-6 max-w-sm text-sm text-muted">
          This digital card is not published yet. The business needs an active QuickConnect plan.
        </p>
      </div>
    );
  }

  if (!card && !error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm text-muted">Loading…</div>
    );
  }

  if (!card) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <BrandMark className="h-8" />
        <p className="mt-6 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const profile = {
    displayName: card.displayName,
    designation: card.designation,
    companyName: card.companyName,
    bio: card.bio,
    phone: card.phone,
    whatsappPhone: card.whatsappPhone,
    email: card.email,
    coverImageUrl: card.coverImageUrl,
    profileImageUrl: card.profileImageUrl,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <main className="mx-auto w-full max-w-[420px] flex-1 px-2 pt-4 sm:px-4 sm:pt-8">
        <ConnectCardShell
          profile={profile}
          links={card.links}
          mode="live"
          onSaveContact={() => downloadConnectVCard(profile)}
          onExchange={() => {
            setLeadSent(false);
            setLeadOpen(true);
          }}
        />
      </main>

      {leadOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exchange-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <h2 id="exchange-title" className="font-display text-lg font-bold">Exchange contact</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setLeadOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-paper"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {leadSent ? (
              <p className="mt-4 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">
                Thanks — your details were sent to {card.displayName}.
              </p>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={(e) => void submitLead(e)}>
                <input
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  required
                  placeholder="Phone"
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <input
                  placeholder="Email (optional)"
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <textarea
                  placeholder="Note (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Send'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, IdCard, Lock, Plus, Trash2 } from 'lucide-react';
import { ConnectCardShell } from '../components/connect/ConnectCardShell';
import { GuestPreviewHeading } from '../components/MobileScreenFrame';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';

type ConnectLink = {
  id: string;
  type: string;
  label: string;
  url: string;
  sortOrder: number;
};

type Hub = {
  slug: string;
  publicPath: string;
  publicUrl: string;
  connectUnlocked: boolean;
  connectAccess: { unlocked: boolean; status: string };
  leadCount: number;
  profile: {
    displayName: string;
    designation: string | null;
    companyName: string | null;
    bio: string | null;
    phone: string | null;
    whatsappPhone: string | null;
    email: string | null;
    coverImageUrl: string | null;
    profileImageUrl: string | null;
    slug: string;
  };
  links: ConnectLink[];
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  createdAt: string;
};

const LINK_TYPES = ['WEBSITE', 'GOOGLE', 'INSTAGRAM', 'WHATSAPP', 'OTHER'] as const;

export function QuickConnectPage() {
  const { selected } = useLocationContext();
  const [hub, setHub] = useState<Hub | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLink, setNewLink] = useState<{ type: (typeof LINK_TYPES)[number]; label: string; url: string }>({
    type: 'WEBSITE',
    label: '',
    url: '',
  });

  const draft = useMemo(() => hub?.profile ?? null, [hub]);

  useEffect(() => {
    if (!selected) {
      setHub(null);
      setLeads([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [data, leadRows] = await Promise.all([
          api<Hub>(`/api/locations/${selected.id}/quickconnect`),
          api<Lead[]>(`/api/locations/${selected.id}/quickconnect/leads`),
        ]);
        if (!cancelled) {
          setHub(data);
          setLeads(leadRows);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load QuickConnect');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api<Hub>(`/api/locations/${selected.id}/quickconnect`, {
        method: 'PATCH',
        body: {
          displayName: draft.displayName,
          designation: draft.designation ?? '',
          companyName: draft.companyName ?? '',
          bio: draft.bio ?? '',
          phone: draft.phone ?? '',
          whatsappPhone: draft.whatsappPhone ?? '',
          email: draft.email ?? '',
          slug: draft.slug,
          coverImageUrl: draft.coverImageUrl ?? '',
          profileImageUrl: draft.profileImageUrl ?? '',
        },
      });
      setHub(updated);
      setMessage('Card saved');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function patchProfile(field: keyof Hub['profile'], value: string) {
    setHub((prev) =>
      prev ? { ...prev, profile: { ...prev.profile, [field]: value } } : prev,
    );
  }

  async function addLink() {
    if (!selected || !newLink.label.trim() || !newLink.url.trim()) return;
    setError(null);
    try {
      await api(`/api/locations/${selected.id}/quickconnect/links`, {
        method: 'POST',
        body: newLink,
      });
      const data = await api<Hub>(`/api/locations/${selected.id}/quickconnect`);
      setHub(data);
      setNewLink({ type: 'WEBSITE', label: '', url: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add link');
    }
  }

  async function removeLink(linkId: string) {
    if (!selected) return;
    try {
      await api(`/api/locations/${selected.id}/quickconnect/links/${linkId}`, { method: 'DELETE' });
      const data = await api<Hub>(`/api/locations/${selected.id}/quickconnect`);
      setHub(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete link');
    }
  }

  async function copyLink() {
    if (!hub) return;
    try {
      await navigator.clipboard.writeText(hub.publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const unlocked = hub?.connectUnlocked ?? false;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <IdCard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">QuickConnect</h1>
          <p className="text-sm text-muted">Digital business card — share link or QR for this location.</p>
        </div>
      </div>

      {!selected ? (
        <p className="mt-6 text-sm text-muted">Select a location at the top to edit your card.</p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>
      ) : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && hub && draft ? (
        <>
          {!unlocked ? (
            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Public card is locked.{' '}
                <Link to="/app/subscription" className="font-semibold underline">
                  Activate QuickConnect
                </Link>{' '}
                so visitors can open {hub.publicPath}.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <form onSubmit={(e) => void saveProfile(e)} className="rounded-2xl border border-line bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Profile</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['displayName', 'Display name'],
                      ['designation', 'Role / title'],
                      ['companyName', 'Company'],
                      ['slug', 'URL slug (/c/…)'],
                      ['phone', 'Phone'],
                      ['whatsappPhone', 'WhatsApp number'],
                      ['email', 'Email'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="block text-sm">
                      <span className="font-semibold">{label}</span>
                      <input
                        className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                        value={draft[key] ?? ''}
                        onChange={(e) => patchProfile(key, e.target.value)}
                      />
                    </label>
                  ))}
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-semibold">Bio</span>
                    <textarea
                      className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                      rows={3}
                      value={draft.bio ?? ''}
                      onChange={(e) => patchProfile('bio', e.target.value)}
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-semibold">Profile photo URL</span>
                    <input
                      className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                      value={draft.profileImageUrl ?? ''}
                      onChange={(e) => patchProfile('profileImageUrl', e.target.value)}
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-semibold">Cover image URL</span>
                    <input
                      className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                      value={draft.coverImageUrl ?? ''}
                      onChange={(e) => patchProfile('coverImageUrl', e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save card'}
                </button>
              </form>

              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Links</p>
                <ul className="mt-3 space-y-2">
                  {hub.links.map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-semibold">{link.label}</span>
                        <span className="ml-2 text-xs text-muted">{link.type}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeLink(link.id)}
                        className="rounded-lg p-1 text-muted hover:bg-red-50 hover:text-red-700"
                        aria-label="Remove link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-2 sm:grid-cols-[8rem_1fr_1fr_auto]">
                  <select
                    className="rounded-xl border border-line px-2 py-2 text-sm"
                    value={newLink.type}
                    onChange={(e) =>
                      setNewLink((prev) => ({
                        ...prev,
                        type: e.target.value as (typeof LINK_TYPES)[number],
                      }))
                    }
                  >
                    {LINK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Label"
                    className="rounded-xl border border-line px-3 py-2 text-sm"
                    value={newLink.label}
                    onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))}
                  />
                  <input
                    placeholder="https://…"
                    className="rounded-xl border border-line px-3 py-2 text-sm"
                    value={newLink.url}
                    onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => void addLink()}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="font-bold">Leads ({hub.leadCount})</p>
                {leads.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No leads yet — visitors can leave contact info on your card.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {leads.map((lead) => (
                      <li key={lead.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-muted">{lead.phone}</p>
                        {lead.note ? <p className="mt-1">{lead.note}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <GuestPreviewHeading />
              <ConnectCardShell profile={draft} links={hub.links} mode="preview" />
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Public link</p>
                <p className="mt-2 break-all font-mono text-xs">{hub.publicUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => void copyLink()}
                    className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold disabled:opacity-50"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                  <a
                    href={unlocked ? hub.publicPath : undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!unlocked) e.preventDefault();
                    }}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${
                      unlocked ? 'bg-brand text-white' : 'cursor-not-allowed bg-paper text-muted'
                    }`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Lock, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { IconButton } from '../components/ui/IconButton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { CRM_BASE } from '../lib/crm/paths';
import { ConnectCardShell } from '../components/connect/ConnectCardShell';
import { ImageUrlDropZone } from '../components/connect/ImageUrlDropZone';
import { Field } from '../components/ui/Field';
import { normalizeIndianPhoneInput } from '../lib/format-phone';
import { GuestPreviewHeading } from '../components/MobileScreenFrame';
import { api, ApiError } from '../lib/api';
import { isProductAccessLive, productAccessGateReason } from '../lib/product-access';
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
  connectAccess: { unlocked: boolean; status: string; endDate?: string | null };
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
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);

  const draft = useMemo(() => hub?.profile ?? null, [hub]);

  useEffect(() => {
    if (!draft?.phone || !whatsappSameAsPhone) return;
    if (draft.whatsappPhone === draft.phone) return;
    setHub((prev) =>
      prev ? { ...prev, profile: { ...prev.profile, whatsappPhone: draft.phone } } : prev,
    );
  }, [draft?.phone, whatsappSameAsPhone]);

  useEffect(() => {
    if (!selected) {
      setHub(null);
      setLeads([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const data = await api<Hub>(`/api/locations/${selected.id}/quickconnect`);
        if (cancelled) return;
        setHub(data);
        try {
          const leadRows = await api<Lead[]>(`/api/locations/${selected.id}/quickconnect/leads`);
          if (!cancelled) setLeads(leadRows);
        } catch {
          if (!cancelled) setLeads([]);
        }
      } catch (err) {
        if (!cancelled) {
          setHub(null);
          setLeads([]);
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not load QuickConnect',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (hub?.profile) setSavedSnapshot(JSON.stringify(hub.profile));
  }, [selected?.id, hub?.slug]);

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
          whatsappPhone: (whatsappSameAsPhone ? draft.phone : draft.whatsappPhone) ?? '',
          email: draft.email ?? '',
          slug: draft.slug,
          coverImageUrl: draft.coverImageUrl ?? '',
          profileImageUrl: draft.profileImageUrl ?? '',
        },
      });
      setHub(updated);
      setSavedSnapshot(JSON.stringify(updated.profile));
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

  const planGate = hub?.connectAccess ? productAccessGateReason(hub.connectAccess) : 'inactive';
  const unlocked = hub?.connectAccess ? isProductAccessLive(hub.connectAccess) : false;
  const profileKey = draft ? JSON.stringify(draft) : '';
  const pristine = Boolean(savedSnapshot) && profileKey === savedSnapshot;

  return (
    <div>
      <PageHeader
        breadcrumb="Get customers / QuickConnect"
        title="QuickConnect"
        description="Digital business card — share link or QR for this location."
        status={unlocked ? { variant: 'live' } : undefined}
        actions={
          hub ? (
            <div className="flex max-w-md items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-2 py-1.5">
              <code className="min-w-0 flex-1 truncate font-mono text-xs">{hub.publicUrl.replace(/^https?:\/\//, '')}</code>
              <IconButton aria-label="Copy public link" onClick={() => void copyLink()}>
                {copied ? <Check className="h-[18px] w-[18px]" /> : <Copy className="h-[18px] w-[18px]" />}
              </IconButton>
              <a
                href={unlocked ? hub.publicPath : undefined}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-brand"
                onClick={(e) => {
                  if (!unlocked) e.preventDefault();
                }}
              >
                Open ↗
              </a>
            </div>
          ) : undefined
        }
      />

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
                {planGate === 'expired'
                  ? 'QuickConnect plan expired. '
                  : 'Public card is locked. '}
                <Link to="/app/subscription" className="font-semibold underline">
                  {planGate === 'expired' ? 'Renew plan' : 'Activate QuickConnect'}
                </Link>{' '}
                so visitors can open {hub.publicPath}.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-6">
              <form onSubmit={(e) => void saveProfile(e)} className="rounded-2xl border border-line bg-white p-6">
                <fieldset className="space-y-4">
                  <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Profile</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Display name"
                      value={draft.displayName}
                      onChange={(e) => patchProfile('displayName', e.target.value)}
                    />
                    <Field
                      label="Role or title"
                      placeholder="e.g. Founder & CEO"
                      value={draft.designation ?? ''}
                      onChange={(e) => patchProfile('designation', e.target.value)}
                    />
                    <Field
                      label="Company"
                      value={draft.companyName ?? ''}
                      onChange={(e) => patchProfile('companyName', e.target.value)}
                    />
                    <Field
                      label="Card link"
                      prefix="/c/"
                      value={draft.slug}
                      onChange={(e) => patchProfile('slug', e.target.value.replace(/\s/g, '-').toLowerCase())}
                    />
                  </div>
                </fieldset>

                <hr className="my-6 border-line" />

                <fieldset className="space-y-4">
                  <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Contact</legend>
                  <Field
                    label="Phone"
                    prefix="+91"
                    inputMode="numeric"
                    value={draft.phone ?? ''}
                    onChange={(e) => patchProfile('phone', normalizeIndianPhoneInput(e.target.value))}
                  />
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={whatsappSameAsPhone}
                      onChange={(e) => setWhatsappSameAsPhone(e.target.checked)}
                    />
                    Same as phone
                  </label>
                  <Field
                    label="WhatsApp"
                    prefix="+91"
                    inputMode="numeric"
                    disabled={whatsappSameAsPhone}
                    value={draft.whatsappPhone ?? ''}
                    onChange={(e) => patchProfile('whatsappPhone', normalizeIndianPhoneInput(e.target.value))}
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={draft.email ?? ''}
                    onChange={(e) => patchProfile('email', e.target.value)}
                  />
                </fieldset>

                <hr className="my-6 border-line" />

                <fieldset className="space-y-4">
                  <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">About & images</legend>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold">Bio</span>
                    <textarea
                      className="w-full min-h-[6rem] rounded-[10px] border border-[#CBD5E1] px-3 py-2 text-sm"
                      maxLength={160}
                      rows={3}
                      value={draft.bio ?? ''}
                      onChange={(e) => patchProfile('bio', e.target.value)}
                    />
                    <span className="mt-1 block text-xs text-muted">{(draft.bio ?? '').length}/160</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ImageUrlDropZone
                      label="Profile photo"
                      value={draft.profileImageUrl ?? ''}
                      onChange={(url) => patchProfile('profileImageUrl', url)}
                      aspectClass="aspect-square max-h-40"
                    />
                    <ImageUrlDropZone
                      label="Cover image"
                      value={draft.coverImageUrl ?? ''}
                      onChange={(url) => patchProfile('coverImageUrl', url)}
                      aspectClass="aspect-[2.8/1]"
                    />
                  </div>
                </fieldset>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-xs text-muted">Changes apply to your public card immediately after save.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        if (!hub || !savedSnapshot) return;
                        setHub({ ...hub, profile: JSON.parse(savedSnapshot) as Hub['profile'] });
                      }}
                      disabled={pristine}
                    >
                      Discard
                    </Button>
                    <Button size="sm" type="submit" disabled={saving || pristine}>
                      {saving ? 'Saving…' : 'Save card'}
                    </Button>
                  </div>
                </div>
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
                  <EmptyState
                    icon={<Plus className="h-5 w-5" aria-hidden />}
                    title="No leads yet"
                    description="When a visitor taps Exchange on your card, their details show up here and in CRM."
                    action={
                      <Link to={CRM_BASE} className="text-sm font-semibold text-brand">Open CRM</Link>
                    }
                  />
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
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

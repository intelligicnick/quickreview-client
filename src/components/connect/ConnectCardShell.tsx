import { ExternalLink, Mail, Phone, UserPlus, UserRoundPlus } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { MobileScreenFrame } from '../MobileScreenFrame';

export type ConnectCardProfile = {
  displayName: string;
  designation: string | null;
  companyName: string | null;
  bio: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  email: string | null;
  coverImageUrl: string | null;
  profileImageUrl: string | null;
};

export type ConnectCardLink = {
  id: string;
  type: string;
  label: string;
  url: string;
};

const COVER_FALLBACK =
  'linear-gradient(135deg, rgba(107,47,213,0.85) 0%, rgba(56,189,248,0.75) 100%)';

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

type Props = {
  profile: ConnectCardProfile;
  links: ConnectCardLink[];
  /** Preview in merchant editor — buttons are visual only */
  mode?: 'preview' | 'live';
  onExchange?: () => void;
  onSaveContact?: () => void;
  className?: string;
};

export function ConnectCardShell({
  profile,
  links,
  mode = 'live',
  onExchange,
  onSaveContact,
  className = '',
}: Props) {
  const isPreview = mode === 'preview';
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || '?';
  const canCall = Boolean(profile.phone?.trim());
  const canEmail = Boolean(profile.email?.trim());
  const canWhatsapp = Boolean(profile.whatsappPhone?.trim());

  return (
    <div className={className}>
      <MobileScreenFrame>
          <header className="relative shrink-0">
            {profile.coverImageUrl ? (
              <img
                src={profile.coverImageUrl}
                alt=""
                className="aspect-[2.8/1] w-full object-cover"
              />
            ) : (
              <div className="aspect-[2.8/1] w-full" style={{ background: COVER_FALLBACK }} aria-hidden />
            )}
          </header>

          <section className="relative z-10 flex shrink-0 items-end gap-3 px-4 pb-1">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt=""
                className="h-[4.25rem] w-[4.25rem] shrink-0 -mt-8 rounded-2xl border-[3px] border-white bg-slate-100 object-cover shadow-[0_6px_14px_rgba(15,23,42,0.15)]"
              />
            ) : (
              <div
                className="flex h-[4.25rem] w-[4.25rem] shrink-0 -mt-8 items-center justify-center rounded-2xl border-[3px] border-white bg-slate-100 text-xl font-semibold text-slate-400 shadow-[0_6px_14px_rgba(15,23,42,0.15)]"
              >
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-ink">
                {profile.displayName || 'Your name'}
              </h2>
              {profile.designation || profile.companyName ? (
                <p className="mt-0.5 truncate text-[13px] text-slate-600">
                  {profile.designation}
                  {profile.designation && profile.companyName ? ' · ' : ''}
                  {profile.companyName}
                </p>
              ) : null}
            </div>
          </section>

          {profile.bio ? (
            <p className="shrink-0 px-4 pt-2 text-[13px] leading-relaxed text-slate-600">{profile.bio}</p>
          ) : null}

          <section className="mt-3 flex shrink-0 gap-2 px-4">
            {isPreview ? (
              <>
                <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 px-3 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(107,47,213,0.28)]">
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Save contact
                </span>
                <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[13px] font-semibold text-violet-700">
                  <UserRoundPlus className="h-3.5 w-3.5" aria-hidden />
                  Exchange
                </span>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSaveContact}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 bg-gradient-to-b from-violet-500 to-violet-700 px-3 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(107,47,213,0.28)]"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Save contact
                </button>
                <button
                  type="button"
                  onClick={onExchange}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[13px] font-semibold text-violet-700"
                >
                  <UserRoundPlus className="h-3.5 w-3.5" aria-hidden />
                  Exchange
                </button>
              </>
            )}
          </section>

          {!isPreview && (canCall || canEmail || canWhatsapp) ? (
            <section className="mt-2 grid shrink-0 grid-cols-3 gap-1.5 px-4">
              {canCall ? (
                <a
                  href={telHref(profile.phone!)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-line py-2 text-[11px] font-semibold text-ink no-underline"
                >
                  <Phone className="h-4 w-4 text-brand" />
                  Call
                </a>
              ) : null}
              {canWhatsapp ? (
                <a
                  href={whatsappHref(profile.whatsappPhone!)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 rounded-xl border border-line py-2 text-[11px] font-semibold text-ink no-underline"
                >
                  WA
                </a>
              ) : null}
              {canEmail ? (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex flex-col items-center gap-1 rounded-xl border border-line py-2 text-[11px] font-semibold text-ink no-underline"
                >
                  <Mail className="h-4 w-4 text-brand" />
                  Email
                </a>
              ) : null}
            </section>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {links.length > 0 ? (
              <ul className="space-y-1.5">
                {links.map((link) => (
                  <li key={link.id}>
                    {isPreview ? (
                      <span className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-ink">
                        <span className="truncate">{link.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </span>
                    ) : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-ink no-underline hover:border-brand/30"
                      >
                        <span className="truncate">{link.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full min-h-[8rem]" aria-hidden />
            )}
          </div>

          <footer className="mt-auto flex shrink-0 items-center justify-center gap-1 border-t border-slate-100 px-4 py-2.5">
            <span className="text-[8px] font-semibold tracking-[0.14em] text-slate-400">POWERED BY</span>
            <BrandMark className="!h-3 max-w-[4.5rem] opacity-70" />
          </footer>
      </MobileScreenFrame>
    </div>
  );
}

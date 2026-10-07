import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Download,
  Facebook,
  Instagram,
  Loader2,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api, apiBlob, ApiError } from '../lib/api';
import {
  compositedPosterBlob,
  downloadCompositedPoster,
  type ExportAspect,
} from '../lib/design-export';
import {
  themeOnPhoto,
  type PosterOverlayText,
  type PosterOverlayTheme,
} from '../lib/design-poster-overlay';
import { useLocationContext } from '../lib/location-context';
import type { Location } from '../lib/types';

type PictureMode = 'photos' | 'design';
type Template = 'sale' | 'festival' | 'cta' | 'hours' | 'new' | 'custom';
type OfferKind = 'percent' | 'flat' | 'bogo' | 'addon';
type AppliesTo = 'everything' | 'services';

type Poster = {
  id: string;
  template: Template;
  pictureMode: PictureMode;
  offerText: string | null;
  festival: string | null;
  aspectRatio: string;
  imageUrl: string;
  createdAt: string;
};

type Hub = {
  designUnlocked: boolean;
  locationName: string;
  posters: Poster[];
  quota: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    monthlyLimit: number;
  };
  options: {
    pictureModes: Array<{ id: PictureMode; label: string; hint: string }>;
    aspectRatios: Array<{ id: ExportAspect; label: string; channel: string }>;
    imageProvider: string;
    perchanceReady: boolean;
    perchanceUrl: string;
  };
};

const DEFAULT_ASPECT_RATIOS: Hub['options']['aspectRatios'] = [
  { id: '9:16', label: 'Story 9:16', channel: 'WhatsApp Status · Instagram Stories' },
  { id: '1:1', label: 'Square 1:1', channel: 'Instagram · Facebook post' },
  { id: '4:5', label: 'Portrait 4:5', channel: 'Instagram feed' },
];

const ASPECT_PREVIEW_CLASS: Record<ExportAspect, string> = {
  '9:16': 'aspect-[9/16] w-[min(100%,240px)]',
  '1:1': 'aspect-square w-[min(100%,260px)]',
  '4:5': 'aspect-[4/5] w-[min(100%,250px)]',
};

const PURPOSE: { id: Template; label: string }[] = [
  { id: 'festival', label: 'Festival sale' },
  { id: 'sale', label: 'Everyday sale' },
  { id: 'new', label: 'New service' },
  { id: 'cta', label: 'Call now' },
  { id: 'hours', label: 'Hours / open now' },
  { id: 'custom', label: 'Custom' },
];

type PreviewTheme = {
  gradient: string;
  headline: string;
  subhead: string;
  scope: string;
  footer: string;
  badgeBg: string;
  badgeText: string;
};

type LookDef = {
  id: string;
  label: string;
  hint: string;
  theme: PreviewTheme;
};

const LOOKS: LookDef[] = [
  {
    id: 'festival-gold',
    label: 'Festival gold',
    hint: 'Premium · festive',
    theme: {
      gradient: 'linear-gradient(165deg, #fcd34d 0%, #92400e 48%, #1c0f05 100%)',
      headline: '#fffbeb',
      subhead: 'rgba(255, 251, 235, 0.88)',
      scope: 'rgba(255, 251, 235, 0.72)',
      footer: '#fef3c7',
      badgeBg: '#fbbf24',
      badgeText: '#422006',
    },
  },
  {
    id: 'hot-sale',
    label: 'Hot sale',
    hint: 'Loud · packed',
    theme: {
      gradient: 'linear-gradient(165deg, #dc2626 0%, #fca5a5 42%, #fff1f2 100%)',
      headline: '#ffffff',
      subhead: 'rgba(255, 255, 255, 0.92)',
      scope: 'rgba(127, 29, 29, 0.75)',
      footer: '#7f1d1d',
      badgeBg: '#ffffff',
      badgeText: '#b91c1c',
    },
  },
  {
    id: 'night-glam',
    label: 'Night glam',
    hint: 'Fast · urban',
    theme: {
      gradient: 'linear-gradient(165deg, #818cf8 0%, #312e81 45%, #020617 100%)',
      headline: '#e0e7ff',
      subhead: 'rgba(224, 231, 255, 0.85)',
      scope: 'rgba(199, 210, 254, 0.7)',
      footer: '#c7d2fe',
      badgeBg: '#f472b6',
      badgeText: '#1e1b4b',
    },
  },
  {
    id: 'soft-spa',
    label: 'Soft spa',
    hint: 'Gentle · airy',
    theme: {
      gradient: 'linear-gradient(165deg, #fbcfe8 0%, #e9d5ff 50%, #fdf4ff 100%)',
      headline: '#581c87',
      subhead: 'rgba(88, 28, 135, 0.78)',
      scope: 'rgba(107, 33, 168, 0.65)',
      footer: '#6b21a8',
      badgeBg: '#ffffff',
      badgeText: '#7e22ce',
    },
  },
  {
    id: 'clean',
    label: 'Clean',
    hint: 'Quiet · editorial',
    theme: {
      gradient: 'linear-gradient(165deg, #e7e5e4 0%, #fafaf9 65%, #ffffff 100%)',
      headline: '#1c1917',
      subhead: 'rgba(28, 25, 23, 0.72)',
      scope: 'rgba(28, 25, 23, 0.55)',
      footer: '#44403c',
      badgeBg: '#1c1917',
      badgeText: '#fafaf9',
    },
  },
  {
    id: 'royal',
    label: 'Royal',
    hint: 'Slow · exclusive',
    theme: {
      gradient: 'linear-gradient(165deg, #eab308 0%, #44403c 50%, #0c0a09 100%)',
      headline: '#fef9c3',
      subhead: 'rgba(254, 249, 195, 0.88)',
      scope: 'rgba(234, 179, 8, 0.65)',
      footer: '#fde047',
      badgeBg: '#ca8a04',
      badgeText: '#1c1917',
    },
  },
];

/** Chip list matches EasyReview EasyStory design reference (`docs/design/easystory-easyreview-reference.png`). */
const FESTIVALS = [
  'Diwali',
  'Holi',
  'Eid',
  'Christmas',
  'Ugadi',
  'Onam',
  'Pongal',
  'Navratri',
  'Ganesh Chaturthi',
] as const;

type FestivalName = (typeof FESTIVALS)[number];

const FESTIVAL_PACK: Record<
  FestivalName,
  { lookId: string; tagline: string; theme: PreviewTheme }
> = {
  Diwali: {
    lookId: 'festival-gold',
    tagline: 'Glow up this diwali',
    theme: {
      gradient: 'linear-gradient(165deg, #fde047 0%, #b45309 40%, #451a03 100%)',
      headline: '#fff7ed',
      subhead: 'rgba(255, 247, 237, 0.9)',
      scope: 'rgba(253, 230, 138, 0.8)',
      footer: '#ffedd5',
      badgeBg: '#facc15',
      badgeText: '#422006',
    },
  },
  Holi: {
    lookId: 'hot-sale',
    tagline: 'Celebrate in colour',
    theme: {
      gradient: 'linear-gradient(160deg, #fde047 0%, #f472b6 38%, #22d3ee 68%, #c084fc 100%)',
      headline: '#1e1b4b',
      subhead: 'rgba(30, 27, 75, 0.82)',
      scope: 'rgba(76, 29, 149, 0.7)',
      footer: '#312e81',
      badgeBg: '#ffffff',
      badgeText: '#be185d',
    },
  },
  Eid: {
    lookId: 'royal',
    tagline: 'Warm wishes this Eid',
    theme: {
      gradient: 'linear-gradient(165deg, #34d399 0%, #065f46 55%, #022c22 100%)',
      headline: '#ecfdf5',
      subhead: 'rgba(236, 253, 245, 0.88)',
      scope: 'rgba(167, 243, 208, 0.75)',
      footer: '#a7f3d0',
      badgeBg: '#fcd34d',
      badgeText: '#064e3b',
    },
  },
  Christmas: {
    lookId: 'festival-gold',
    tagline: 'Season’s greetings',
    theme: {
      gradient: 'linear-gradient(165deg, #ef4444 0%, #166534 50%, #0f172a 100%)',
      headline: '#fef2f2',
      subhead: 'rgba(254, 242, 242, 0.9)',
      scope: 'rgba(187, 247, 208, 0.75)',
      footer: '#fecaca',
      badgeBg: '#ffffff',
      badgeText: '#b91c1c',
    },
  },
  Ugadi: {
    lookId: 'festival-gold',
    tagline: 'Happy Ugadi',
    theme: {
      gradient: 'linear-gradient(165deg, #84cc16 0%, #fef08a 45%, #854d0e 100%)',
      headline: '#1a2e05',
      subhead: 'rgba(26, 46, 5, 0.8)',
      scope: 'rgba(63, 98, 18, 0.7)',
      footer: '#365314',
      badgeBg: '#fef08a',
      badgeText: '#1a2e05',
    },
  },
  Onam: {
    lookId: 'soft-spa',
    tagline: 'Happy Onam',
    theme: {
      gradient: 'linear-gradient(165deg, #fef08a 0%, #f472b6 40%, #15803d 100%)',
      headline: '#ffffff',
      subhead: 'rgba(255, 255, 255, 0.9)',
      scope: 'rgba(255, 255, 255, 0.75)',
      footer: '#fef9c3',
      badgeBg: '#ffffff',
      badgeText: '#15803d',
    },
  },
  Pongal: {
    lookId: 'festival-gold',
    tagline: 'Happy Pongal',
    theme: {
      gradient: 'linear-gradient(165deg, #fdba74 0%, #fef3c7 50%, #b45309 100%)',
      headline: '#431407',
      subhead: 'rgba(67, 20, 7, 0.78)',
      scope: 'rgba(124, 45, 18, 0.65)',
      footer: '#7c2d12',
      badgeBg: '#fed7aa',
      badgeText: '#431407',
    },
  },
  Navratri: {
    lookId: 'festival-gold',
    tagline: 'Nine nights of joy',
    theme: {
      gradient: 'linear-gradient(165deg, #f97316 0%, #c026d3 42%, #4c1d95 100%)',
      headline: '#fff7ed',
      subhead: 'rgba(255, 247, 237, 0.9)',
      scope: 'rgba(253, 186, 116, 0.8)',
      footer: '#fed7aa',
      badgeBg: '#fde047',
      badgeText: '#581c87',
    },
  },
  'Ganesh Chaturthi': {
    lookId: 'festival-gold',
    tagline: 'Ganpati Bappa Morya',
    theme: {
      gradient: 'linear-gradient(165deg, #f97316 0%, #dc2626 35%, #7c2d12 100%)',
      headline: '#fff7ed',
      subhead: 'rgba(255, 247, 237, 0.9)',
      scope: 'rgba(254, 215, 170, 0.8)',
      footer: '#ffedd5',
      badgeBg: '#fbbf24',
      badgeText: '#7c2d12',
    },
  },
};

function festivalTagline(name: string): string {
  if (name in FESTIVAL_PACK) return FESTIVAL_PACK[name as FestivalName].tagline;
  return `Special ${name} offers`;
}

function resolvePreviewTheme(template: Template, festival: string, look: string): PreviewTheme {
  if (template === 'festival' && festival && festival in FESTIVAL_PACK) {
    return FESTIVAL_PACK[festival as FestivalName].theme;
  }
  const row = LOOKS.find((item) => item.id === look);
  return row?.theme ?? LOOKS[0].theme;
}

function festivalLookId(name: string): string {
  if (name in FESTIVAL_PACK) return FESTIVAL_PACK[name as FestivalName].lookId;
  return 'festival-gold';
}

const DEFAULT_LOOK: Record<Template, string> = {
  festival: 'festival-gold',
  sale: 'hot-sale',
  cta: 'night-glam',
  hours: 'clean',
  new: 'soft-spa',
  custom: 'clean',
};

export function buildOfferLine(
  kind: OfferKind,
  value: number,
  applies: AppliesTo,
  extra?: string,
): string {
  const scope = applies === 'everything' ? 'on everything' : 'on selected services';
  let core = '';
  if (kind === 'percent') core = `${value}% OFF`;
  else if (kind === 'flat') core = `₹${value} OFF`;
  else if (kind === 'bogo') core = 'Buy 1 Get 1';
  else core = 'Free add-on';
  const parts = [core, scope];
  if (extra?.trim()) parts.push(extra.trim());
  return parts.join(' · ');
}

function templateHeadline(template: Template, festival: string): string {
  if (template === 'festival' && festival) return festival.toUpperCase();
  if (template === 'sale') return 'SALE';
  if (template === 'new') return 'NEW';
  if (template === 'cta') return 'CALL NOW';
  if (template === 'hours') return 'OPEN NOW';
  return 'YOUR STORY';
}

function templateSubhead(template: Template, festival: string): string {
  if (template === 'festival' && festival) {
    return festivalTagline(festival);
  }
  if (template === 'sale') return 'Limited-time deals';
  if (template === 'new') return 'Something new for you';
  if (template === 'cta') return 'Book your slot today';
  if (template === 'hours') return 'We’re open — visit us';
  return 'Your custom poster';
}

function offerBadge(kind: OfferKind, value: number): string {
  if (kind === 'percent') return `${value}% OFF`;
  if (kind === 'flat') return `₹${value} OFF`;
  if (kind === 'bogo') return 'BUY 1 GET 1';
  return 'FREE ADD-ON';
}

function appliesLabel(applies: AppliesTo): string {
  return applies === 'everything' ? 'on everything' : 'on selected services';
}

function StepTitle({ step, label }: { step: number; label: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wide text-brand">
      {step} — {label}
    </p>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

type PreviewProps = {
  theme: PreviewTheme;
  aspect: ExportAspect;
  headline: string;
  subhead: string;
  badge: string;
  scope: string;
  businessName: string | null;
  phone: string | null;
  imageUrl?: string | null;
};

type PosterTextBlockProps = {
  theme: PosterOverlayTheme;
  headline: string;
  subhead: string;
  badge: string;
  scope: string;
  businessName: string | null;
  phone: string | null;
};

function PosterTextBlock({
  theme,
  headline,
  subhead,
  badge,
  scope,
  businessName,
  phone,
}: PosterTextBlockProps) {
  return (
    <>
      <p
        className="font-display text-2xl font-extrabold tracking-tight"
        style={{ color: theme.headline }}
      >
        {headline}
      </p>
      <p className="mt-1 text-sm font-medium" style={{ color: theme.subhead }}>{subhead}</p>
      <div className="mt-auto space-y-2 pb-2">
        <span
          className="inline-block rounded-md px-3 py-1.5 text-sm font-extrabold shadow-sm"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
        >
          {badge}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.scope }}>
          {scope}
        </p>
        {businessName ? (
          <p className="text-sm font-bold" style={{ color: theme.footer }}>{businessName}</p>
        ) : null}
        {phone ? (
          <p className="text-xs" style={{ color: theme.subhead }}>{phone}</p>
        ) : null}
      </div>
    </>
  );
}

function StoryPhonePreview({
  theme,
  aspect,
  headline,
  subhead,
  badge,
  scope,
  businessName,
  phone,
  imageUrl,
}: PreviewProps) {
  const storyFrame = aspect === '9:16';
  const textTheme: PosterOverlayTheme = imageUrl
    ? themeOnPhoto(theme)
    : {
        headline: theme.headline,
        subhead: theme.subhead,
        scope: theme.scope,
        footer: theme.footer,
        badgeBg: theme.badgeBg,
        badgeText: theme.badgeText,
      };
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
        {imageUrl ? 'Your design' : 'Live preview'}
      </p>
      <div
        className={`mx-auto mt-4 ${
          storyFrame ? 'w-[min(100%,240px)] rounded-[2rem] border-[10px] border-ink/10 bg-ink/90 p-1 shadow-lg' : ''
        }`}
      >
        <div
          className={`relative mx-auto overflow-hidden ${ASPECT_PREVIEW_CLASS[aspect]} ${
            storyFrame ? 'rounded-[1.35rem]' : 'rounded-xl border border-line shadow-sm'
          }`}
        >
          {imageUrl ? (
            <>
              <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/80"
                aria-hidden
              />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: theme.gradient }} aria-hidden />
          )}
          <div className="relative flex h-full min-h-full flex-col p-4">
            <PosterTextBlock
              theme={textTheme}
              headline={headline}
              subhead={subhead}
              badge={badge}
              scope={scope}
              businessName={businessName}
              phone={phone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickDesignPage() {
  const { selected } = useLocationContext();
  const [hub, setHub] = useState<Hub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState<Template>('festival');
  const [look, setLook] = useState('festival-gold');
  const [picture, setPicture] = useState<PictureMode>('photos');
  const [aspectRatio, setAspectRatio] = useState<ExportAspect>('9:16');
  const [generateStatus, setGenerateStatus] = useState<string | null>(null);
  const [festival, setFestival] = useState<FestivalName | 'Other'>('Diwali');
  const [customFestival, setCustomFestival] = useState('');
  const [moodOverride, setMoodOverride] = useState(false);
  const [offerKind, setOfferKind] = useState<OfferKind>('percent');
  const [offerValue, setOfferValue] = useState(20);
  const [appliesTo, setAppliesTo] = useState<AppliesTo>('everything');
  const [customLine, setCustomLine] = useState('');
  const [showCustomLine, setShowCustomLine] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [includeBusinessName, setIncludeBusinessName] = useState(true);
  const [includePhone, setIncludePhone] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewPosterId, setPreviewPosterId] = useState<string | null>(null);
  const composedOffer = useMemo(() => {
    if (template === 'custom') return customLine.trim() || prompt.trim();
    if (template === 'cta') return customLine.trim() || 'Call now to book';
    if (template === 'hours') return customLine.trim() || 'Open today — walk in welcome';
    if (template === 'new') return customLine.trim() || 'New service now available';
    return buildOfferLine(offerKind, offerValue, appliesTo, showCustomLine ? customLine : undefined);
  }, [
    template,
    offerKind,
    offerValue,
    appliesTo,
    customLine,
    showCustomLine,
    prompt,
  ]);

  const activeFestivalName =
    festival === 'Other' ? customFestival.trim() : festival;

  const canGenerate =
    (template !== 'custom' || prompt.trim().length >= 2) &&
    (template !== 'festival' || activeFestivalName.length >= 2);

  const previewTheme = useMemo(() => {
    if (
      template === 'festival' &&
      !moodOverride &&
      festival !== 'Other' &&
      festival in FESTIVAL_PACK
    ) {
      return FESTIVAL_PACK[festival].theme;
    }
    return resolvePreviewTheme(template, activeFestivalName, look);
  }, [template, festival, moodOverride, activeFestivalName, look]);

  function selectFestival(name: FestivalName | 'Other') {
    setFestival(name);
    setMoodOverride(false);
    if (name !== 'Other') setLook(festivalLookId(name));
  }

  function selectLook(id: string) {
    setLook(id);
    setMoodOverride(true);
  }

  useEffect(() => {
    setLook(DEFAULT_LOOK[template]);
    setMoodOverride(false);
    if (template === 'festival') setFestival('Diwali');
  }, [template]);

  useEffect(() => {
    if (!selected) {
      setHub(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [data, location] = await Promise.all([
          api<Hub>(`/api/locations/${selected.id}/quickdesign`),
          api<Location>(`/api/locations/${selected.id}`),
        ]);
        if (!cancelled) {
          setHub(data);
          setBusinessName(location.name);
          setPhoneNumber(location.phone ?? '');
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load QuickDesign');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected || !hub?.posters.length) return;
    let cancelled = false;
    void (async () => {
      const next: Record<string, string> = {};
      for (const poster of hub.posters) {
        if (previewUrls[poster.id]) {
          next[poster.id] = previewUrls[poster.id];
          continue;
        }
        try {
          const blob = await apiBlob(
            `/api/locations/${selected.id}/quickdesign/posters/${poster.id}/image`,
          );
          next[poster.id] = URL.createObjectURL(blob);
        } catch {
          // skip broken preview
        }
      }
      if (!cancelled) setPreviewUrls(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when poster list changes
  }, [selected?.id, hub?.posters]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const aspectOptions = hub?.options.aspectRatios ?? DEFAULT_ASPECT_RATIOS;
  const serverPerchance = hub?.options.imageProvider === 'perchance';

  const pictureHint = useMemo(
    () => hub?.options.pictureModes.find((row) => row.id === picture)?.hint ?? '',
    [hub, picture],
  );

  const fieldClass =
    'mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15';

  const previewImageUrl = previewPosterId ? previewUrls[previewPosterId] : null;

  function designBody() {
    return {
      template,
      look,
      picture,
      aspectRatio,
      offerText: composedOffer || undefined,
      festival: template === 'festival' ? activeFestivalName || undefined : undefined,
      prompt: template === 'custom' ? prompt : undefined,
      includeBusinessName,
      includePhone,
      businessName: businessName.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
    };
  }

  const displayName = includeBusinessName ? businessName.trim() || selected?.name || null : null;
  const displayPhone = includePhone ? phoneNumber.trim() || null : null;
  const headline = templateHeadline(template, activeFestivalName);
  const subhead = templateSubhead(template, activeFestivalName);
  const badge =
    template === 'festival' || template === 'sale'
      ? offerBadge(offerKind, offerValue)
      : composedOffer.slice(0, 24).toUpperCase() || 'OFFER';

  const overlayText: PosterOverlayText = useMemo(
    () => ({
      headline,
      subhead,
      badge,
      scope: appliesLabel(appliesTo),
      businessName: displayName,
      phone: displayPhone,
    }),
    [headline, subhead, badge, appliesTo, displayName, displayPhone],
  );

  async function generate() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setPreviewPosterId(null);
    setGenerateStatus(
      serverPerchance
        ? 'Generating on Perchance (realistic style)…'
        : 'Preparing your design…',
    );
    try {
      const result = await api<{ poster: Poster; quota: Hub['quota'] }>(
        `/api/locations/${selected.id}/quickdesign/generate`,
        { method: 'POST', body: designBody() },
      );
      setHub((prev) =>
        prev
          ? { ...prev, posters: [result.poster, ...prev.posters], quota: result.quota }
          : prev,
      );
      const blob = await apiBlob(
        `/api/locations/${selected.id}/quickdesign/posters/${result.poster.id}/image`,
      );
      const url = URL.createObjectURL(blob);
      setPreviewUrls((prev) => ({ ...prev, [result.poster.id]: url }));
      setPreviewPosterId(result.poster.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate poster');
    } finally {
      setBusy(false);
      setGenerateStatus(null);
    }
  }

  async function removePoster(posterId: string) {
    if (!selected) return;
    await api(`/api/locations/${selected.id}/quickdesign/posters/${posterId}`, { method: 'DELETE' });
    setHub((prev) =>
      prev ? { ...prev, posters: prev.posters.filter((row) => row.id !== posterId) } : prev,
    );
    const url = previewUrls[posterId];
    if (url) URL.revokeObjectURL(url);
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[posterId];
      return next;
    });
    if (previewPosterId === posterId) setPreviewPosterId(null);
  }

  function compositedExportInput(posterId: string, ratio: ExportAspect) {
    const imageUrl = previewUrls[posterId];
    if (!imageUrl) return null;
    return {
      imageUrl,
      ratio,
      text: overlayText,
      theme: previewTheme,
    };
  }

  async function downloadPoster(posterId: string, ratio: ExportAspect) {
    const input = compositedExportInput(posterId, ratio);
    if (!input) return;
    const base = `quickdesign-${posterId.slice(0, 8)}-${ratio.replace(':', 'x')}`;
    await downloadCompositedPoster(input, `${base}.png`);
  }

  async function sharePoster(posterId: string) {
    const input = compositedExportInput(posterId, '9:16');
    if (!input) return;
    try {
      const blob = await compositedPosterBlob(input);
      const file = new File([blob], 'story.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'QuickDesign story' });
        return;
      }
    } catch {
      // fall through
    }
    void downloadPoster(posterId, '9:16');
  }

  function openWhatsApp() {
    const text = encodeURIComponent(
      [displayName, composedOffer, displayPhone].filter(Boolean).join(' · '),
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  const unlocked = hub?.designUnlocked ?? false;
  const quota = hub?.quota;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">QuickDesign</h1>
      <p className="mt-1 text-sm text-muted">
        Pick a mood and offer — Perchance builds the photo background; your headline, offer, and contact details are layered on top.
      </p>

      {!selected ? (
        <p className="mt-6 text-sm text-muted">Select a location to design posters.</p>
      ) : null}

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && hub ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="space-y-8">
            <section>
              <StepTitle step={1} label="What's it for" />
              <div className="mt-3 flex flex-wrap gap-2">
                {PURPOSE.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      template === item.id
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-white text-ink hover:border-brand/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <StepTitle step={2} label="Mood" />
              <p className="mt-1 text-xs text-muted">
                {template === 'festival' && !moodOverride
                  ? 'Colours follow your festival — pick a mood to override.'
                  : 'Background and text colours stay paired for readability.'}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {LOOKS.map((item) => {
                  const selectedLook = look === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectLook(item.id)}
                      className={`relative overflow-hidden rounded-xl border p-3 text-left transition ${
                        selectedLook ? 'border-brand ring-2 ring-brand/20' : 'border-line hover:border-brand/30'
                      }`}
                    >
                      <div className="h-14 rounded-lg" style={{ background: item.theme.gradient }} />
                      <p className="mt-2 text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted">{item.hint}</p>
                      {selectedLook ? (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">Picture</span>
                <div className="flex rounded-full border border-line p-0.5">
                  <button
                    type="button"
                    onClick={() => setPicture('photos')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      picture === 'photos' ? 'bg-brand text-white' : 'text-muted'
                    }`}
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPicture('design')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      picture === 'design' ? 'bg-brand text-white' : 'text-muted'
                    }`}
                  >
                    Design only
                  </button>
                </div>
              </div>
              {pictureHint ? <p className="mt-2 text-xs text-muted">{pictureHint}</p> : null}
              <label className="mt-4 block">
                <span className="text-xs font-semibold text-muted">Generate size</span>
                <select
                  className={fieldClass}
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as ExportAspect)}
                >
                  {aspectOptions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label} — {row.channel}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section>
              <StepTitle step={3} label="Your offer" />

              {template === 'festival' ? (
                <>
                  <p className="mt-3 text-xs font-semibold text-muted">Festival</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {FESTIVALS.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => selectFestival(name)}
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          festival === name ? 'bg-brand text-white' : 'bg-paper text-muted'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => selectFestival('Other')}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        festival === 'Other' ? 'bg-brand text-white' : 'bg-paper text-muted'
                      }`}
                    >
                      Other
                    </button>
                  </div>
                  {festival === 'Other' ? (
                    <input
                      className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
                      value={customFestival}
                      onChange={(e) => setCustomFestival(e.target.value)}
                      placeholder="Your event name"
                    />
                  ) : null}
                </>
              ) : null}

              {template === 'custom' ? (
                <textarea
                  className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Grand opening banner with gold ribbons…"
                />
              ) : template === 'festival' || template === 'sale' ? (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase text-muted">Offer type</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['percent', '% off'],
                        ['flat', 'Flat ₹ off'],
                        ['bogo', 'Buy 1 get 1'],
                        ['addon', 'Free add-on'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setOfferKind(id)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          offerKind === id ? 'bg-brand text-white' : 'bg-paper text-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {offerKind === 'percent' || offerKind === 'flat' ? (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-sm font-semibold">Value</span>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line font-bold"
                        onClick={() => setOfferValue((v) => Math.max(1, v - (offerKind === 'percent' ? 5 : 50)))}
                      >
                        −
                      </button>
                      <span className="min-w-[3rem] text-center text-lg font-bold">
                        {offerValue}
                        {offerKind === 'percent' ? '%' : ''}
                      </span>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line font-bold"
                        onClick={() => setOfferValue((v) => v + (offerKind === 'percent' ? 5 : 50))}
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                  <p className="mt-4 text-xs font-semibold uppercase text-muted">Applies to</p>
                  <div className="mt-2 flex gap-2">
                    {(
                      [
                        ['everything', 'Everything'],
                        ['services', 'Select services'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAppliesTo(id)}
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                          appliesTo === id ? 'bg-brand text-white' : 'bg-paper text-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <input
                  className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm"
                  value={customLine}
                  onChange={(e) => setCustomLine(e.target.value)}
                  placeholder="Short line for the poster"
                />
              )}

              {template !== 'custom' ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-brand"
                  onClick={() => setShowCustomLine((v) => !v)}
                >
                  {showCustomLine ? '− Hide custom line' : '+ Add a custom line (optional)'}
                </button>
              ) : null}
              {showCustomLine && template !== 'custom' ? (
                <input
                  className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm"
                  value={customLine}
                  onChange={(e) => setCustomLine(e.target.value)}
                  placeholder="e.g. Valid till Sunday"
                />
              ) : null}

              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <ToggleSwitch
                  label="Business name"
                  checked={includeBusinessName}
                  onChange={setIncludeBusinessName}
                />
                {includeBusinessName ? (
                  <input
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                ) : null}
                <ToggleSwitch
                  label="Phone number"
                  checked={includePhone}
                  onChange={setIncludePhone}
                />
                {includePhone ? (
                  <input
                    className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 …"
                  />
                ) : null}
              </div>
            </section>

            {generateStatus ? (
              <p className="text-center text-sm font-medium text-brand">{generateStatus}</p>
            ) : null}
            {unlocked ? (
              <button
                type="button"
                disabled={busy || !canGenerate}
                onClick={() => void generate()}
                className="flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate design ({aspectRatio})
              </button>
            ) : (
              <Link
                to="/app/subscription"
                className="flex w-full min-h-12 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white"
              >
                Select a plan to unlock QuickDesign
              </Link>
            )}
            {quota ? (
              <p className="text-center text-xs text-muted">
                {quota.monthlyLimit - quota.monthlyUsed} of {quota.monthlyLimit} left this month ·{' '}
                {quota.dailyLimit - quota.dailyUsed} of {quota.dailyLimit} today
              </p>
            ) : null}

            <section className="border-t border-line pt-6">
              <p className="text-sm font-semibold">History</p>
              {hub.posters.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No stories yet. Generate your first poster.</p>
              ) : (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {hub.posters.map((poster) => (
                    <li key={poster.id} className="rounded-xl border border-line p-2">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setPreviewPosterId(poster.id)}
                      >
                        {previewUrls[poster.id] ? (
                          <img
                            src={previewUrls[poster.id]}
                            alt=""
                            className="mx-auto max-h-40 w-auto rounded-lg"
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center rounded-lg bg-paper text-xs text-muted">
                            Loading…
                          </div>
                        )}
                        <p className="mt-1 text-xs font-semibold uppercase text-muted">
                          {poster.template} · {poster.pictureMode}
                        </p>
                      </button>
                      <div className="mt-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => void downloadPoster(poster.id, '9:16')}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line py-1.5 text-xs font-semibold"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => void sharePoster(poster.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-line px-2 py-1.5 text-xs font-semibold"
                          aria-label="Share"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removePoster(poster.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-line px-2 py-1.5 text-xs font-semibold text-red-700"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            </div>
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <StoryPhonePreview
              theme={previewTheme}
              aspect={aspectRatio}
              headline={headline}
              subhead={subhead}
              badge={badge}
              scope={appliesLabel(appliesTo)}
              businessName={displayName}
              phone={displayPhone}
              imageUrl={previewImageUrl}
            />
            <div className="mt-3 space-y-2">
              <p className="text-center text-xs font-semibold text-muted">Download as</p>
              <div className="flex flex-wrap justify-center gap-2">
                {(['9:16', '1:1', '4:5'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    disabled={!previewPosterId || busy}
                    onClick={() => previewPosterId && void downloadPoster(previewPosterId, ratio)}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-white px-2 text-xs font-semibold disabled:opacity-40 sm:text-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={openWhatsApp}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-emerald-600"
                aria-label="WhatsApp"
              >
                <span className="text-lg font-bold">W</span>
              </button>
              <button
                type="button"
                disabled={!previewPosterId}
                onClick={() => previewPosterId && void sharePoster(previewPosterId)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white disabled:opacity-40"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-muted opacity-50"
                title="Share from your phone after download"
              >
                <Instagram className="h-4 w-4" />
              </span>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-muted opacity-50"
                title="Share from your phone after download"
              >
                <Facebook className="h-4 w-4" />
              </span>
            </div>
            {previewPosterId ? (
              <button
                type="button"
                className="mt-2 w-full text-center text-xs font-semibold text-brand"
                onClick={() => setPreviewPosterId(null)}
              >
                Back to live preview
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

if (import.meta.env.DEV) {
  const sample = buildOfferLine('percent', 20, 'everything');
  console.assert(sample.includes('20% OFF') && sample.includes('everything'), 'buildOfferLine');
}

import { Phone } from 'lucide-react';

const BANNER_BG =
  'linear-gradient(135deg, #1a6dff 0%, #1557d6 55%, #0f4bb8 100%)';

type Props = {
  pageTitle: string;
  locationName: string;
  address: string | null;
  phone: string | null;
  bannerImageUrl?: string | null;
};

export function MenuCatalogBanner({
  pageTitle,
  locationName,
  address,
  phone,
  bannerImageUrl,
}: Props) {
  const tel = phone?.trim() ? phone.replace(/\s/g, '') : null;

  return (
    <div className="relative w-full overflow-hidden pb-6 pt-4">
      {bannerImageUrl ? (
        <>
          <img
            src={bannerImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/70"
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: BANNER_BG }} aria-hidden>
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,255,255,0.35), transparent 55%)',
            }}
          />
        </div>
      )}
      <div className="relative mx-auto max-w-lg px-4">
        <div className="relative flex items-start justify-between gap-3 text-left text-white">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/75">{pageTitle}</p>
            <h1 className="mt-0.5 font-display text-2xl font-extrabold leading-tight">{locationName}</h1>
            {address ? (
              <p className="mt-1.5 text-sm leading-snug text-white/85">{address}</p>
            ) : null}
            {tel ? (
              <a
                href={`tel:${tel}`}
                className="mt-2 inline-block text-sm font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white"
              >
                {phone}
              </a>
            ) : null}
          </div>
          {tel ? (
            <a
              href={`tel:${tel}`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-md hover:bg-white/95"
              aria-label={`Call ${phone}`}
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

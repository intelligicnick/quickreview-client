import { Star } from 'lucide-react';
import { BrandMark } from '../BrandMark';

const RATING_OPTIONS: Record<number, { label: string }> = {
  1: { label: 'Terrible' },
  2: { label: 'Okay' },
  3: { label: 'Happy' },
  4: { label: 'Very Good' },
  5: { label: 'Excellent' },
};

type Props = {
  locationName: string;
  subtitle: string;
  previewStars?: number;
  compact?: boolean;
  showTapHint?: boolean;
};

/** In-frame guest rating step — matches public ReviewPage / RateCard layout. */
export function ReviewGuestRatingPreview({
  locationName,
  subtitle,
  previewStars = 4,
  compact = false,
  showTapHint = false,
}: Props) {
  const previewOption = RATING_OPTIONS[previewStars];
  const starClass = compact ? 'h-7 w-7' : 'h-9 w-9';
  const titleClass = compact
    ? 'font-display text-[15px] font-bold leading-tight tracking-tight text-ink'
    : 'font-display text-lg font-bold leading-tight tracking-tight text-ink';
  const subClass = compact ? 'mt-1 text-[10px] leading-snug text-muted' : 'mt-1.5 text-[13px] leading-relaxed text-muted';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={`flex shrink-0 items-center justify-between gap-2 ${
          compact ? 'px-2.5 pb-0.5 pt-0.5' : 'px-4 pb-1 pt-0.5'
        }`}
      >
        <BrandMark className={compact ? '!h-5 max-w-[5.25rem]' : '!h-7 max-w-[7.5rem]'} />
        <span
          className={`shrink-0 rounded-full bg-brand/10 font-semibold text-brand-dark ${
            compact ? 'px-1.5 py-0.5 text-[7px] leading-none tracking-wide' : 'px-2 py-0.5 text-[10px]'
          }`}
        >
          {compact ? 'Verified' : 'Verified Feedback'}
        </span>
      </header>

      <div
        className={`flex min-h-0 flex-1 flex-col justify-center text-center ${
          compact ? 'px-2.5 py-2' : 'px-4 py-4'
        }`}
      >
        <h2 className={titleClass}>{locationName}</h2>
        <p className={subClass}>{subtitle}</p>

        <div
          className={`flex items-center justify-center ${compact ? 'mt-3 gap-0.5' : 'mt-6 gap-1'}`}
          aria-hidden
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= previewStars;
            return (
              <Star
                key={value}
                className={`${starClass} ${
                  filled
                    ? 'fill-gold text-gold drop-shadow-[0_0_8px_rgba(245,180,0,0.45)]'
                    : 'fill-transparent text-slate-300'
                }`}
                strokeWidth={1.5}
              />
            );
          })}
        </div>

        <span
          className={`mt-3 inline-flex items-center justify-center gap-1 rounded-full bg-amber-50 font-semibold text-amber-800 ${
            compact ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'
          }`}
        >
          {previewOption.label}
        </span>

        {showTapHint ? (
          <p
            className={`font-semibold uppercase tracking-[0.14em] text-muted ${
              compact ? 'mt-3 text-[8px]' : 'mt-5 text-[10px]'
            }`}
          >
            Tap a star to share your review
          </p>
        ) : null}
      </div>

      <footer
        className={`mt-auto flex shrink-0 items-center justify-center gap-1 border-t border-slate-100 ${
          compact ? 'px-2.5 py-1.5' : 'px-4 py-2.5'
        }`}
      >
        <span
          className={`font-semibold tracking-[0.14em] text-slate-400 ${
            compact ? 'text-[6px]' : 'text-[8px]'
          }`}
        >
          POWERED BY
        </span>
        <BrandMark className={compact ? '!h-2 max-w-[3.25rem] opacity-70' : '!h-3 max-w-[4.5rem] opacity-70'} />
      </footer>
    </div>
  );
}

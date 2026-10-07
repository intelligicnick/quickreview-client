import { Star } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { GuestPreviewHeading, MobileScreenFrame } from '../MobileScreenFrame';

const RATING_OPTIONS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Terrible', emoji: '😢' },
  2: { label: 'Okay', emoji: '😐' },
  3: { label: 'Happy', emoji: '😊' },
  4: { label: 'Very Good', emoji: '😄' },
  5: { label: 'Excellent', emoji: '🤩' },
};

type Props = {
  locationName: string;
  address?: string | null;
  locked?: boolean;
};

export function ReviewGuestPreview({ locationName, address, locked = false }: Props) {
  const previewStars = 4;
  const previewOption = RATING_OPTIONS[previewStars];

  return (
    <div className="space-y-4">
      <GuestPreviewHeading />
      <MobileScreenFrame>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {locked ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 px-4 text-center backdrop-blur-[1px]"
              aria-hidden
            >
              <p className="text-sm font-semibold text-muted">Activate QuickReview to publish</p>
            </div>
          ) : null}

          <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1 pt-1">
            <BrandMark className="!h-7 max-w-[7.5rem]" />
            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
              Verified Feedback
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-4 text-center">
            <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-ink">
              {locationName}
            </h2>
            {address ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{address}</p>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                How was your experience with us today?
              </p>
            )}

            <div className="mt-6 flex items-center justify-center gap-1" aria-hidden>
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= previewStars;
                return (
                  <Star
                    key={value}
                    className={`h-9 w-9 ${
                      filled
                        ? 'fill-gold text-gold drop-shadow-[0_0_8px_rgba(245,180,0,0.45)]'
                        : 'fill-transparent text-slate-300'
                    }`}
                    strokeWidth={1.5}
                  />
                );
              })}
            </div>

            <span className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {previewOption.label} <span className="text-sm leading-none">{previewOption.emoji}</span>
            </span>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Tap a star to share your review
            </p>
          </div>

          <footer className="mt-auto flex shrink-0 items-center justify-center gap-1 border-t border-slate-100 px-4 py-2.5">
            <span className="text-[8px] font-semibold tracking-[0.14em] text-slate-400">POWERED BY</span>
            <BrandMark className="!h-3 max-w-[4.5rem] opacity-70" />
          </footer>
        </div>
      </MobileScreenFrame>
    </div>
  );
}

import { Star } from 'lucide-react';
import { BrandMark } from '../../BrandMark';

export function LandingReviewScreen() {
  const previewStars = 4;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pt-2">
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-1">
        <BrandMark className="!h-6 max-w-[6.5rem]" />
        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-semibold text-brand-dark">
          Verified Feedback
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 py-3 text-center">
        <h2 className="font-display text-base font-bold leading-tight tracking-tight text-ink">
          Sunrise Café
        </h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">How was your visit today?</p>

        <div className="mt-4 flex items-center justify-center gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= previewStars;
            return (
              <Star
                key={value}
                className={`h-7 w-7 ${
                  filled
                    ? 'fill-gold text-gold drop-shadow-[0_0_6px_rgba(245,180,0,0.4)]'
                    : 'fill-transparent text-slate-300'
                }`}
                strokeWidth={1.5}
              />
            );
          })}
        </div>

        <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
          Very Good <span className="text-xs leading-none">😄</span>
        </span>
      </div>

      <footer className="mt-auto flex shrink-0 items-center justify-center gap-1 border-t border-slate-100 px-3 py-2">
        <span className="text-[7px] font-semibold tracking-[0.12em] text-slate-400">POWERED BY</span>
        <BrandMark className="!h-2.5 max-w-[4rem] opacity-70" />
      </footer>
    </div>
  );
}

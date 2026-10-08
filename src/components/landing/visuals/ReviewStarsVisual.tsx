import { Star } from 'lucide-react';

export function ReviewStarsVisual() {
  const previewStars = 4;

  return (
    <div className="relative flex h-full items-center justify-center p-6" aria-hidden>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand/20 blur-2xl" />
      <div className="relative w-full max-w-[240px] rounded-2xl border border-line bg-white p-5 shadow-lg">
        <p className="text-center font-display text-sm font-bold text-ink">Sunrise Café</p>
        <p className="mt-1 text-center text-[11px] text-muted">How was your visit?</p>
        <div className="mt-4 flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-7 w-7 ${
                value <= previewStars
                  ? 'fill-gold text-gold'
                  : 'fill-transparent text-slate-300'
              }`}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="mt-3 flex justify-center">
          <span className="rounded-full bg-amber-50 px-3 py-0.5 text-[10px] font-semibold text-amber-800">
            Very Good 😄
          </span>
        </span>
      </div>
    </div>
  );
}

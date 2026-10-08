import { IdCard, Palette, Star, UtensilsCrossed, Users } from 'lucide-react';

const TILES = [
  { title: 'QuickReview', sub: '4.8★ avg', icon: Star, className: 'landing-float-tile top-[8%] left-[6%] -rotate-3' },
  { title: 'Quick Commerce', sub: '42 items', icon: UtensilsCrossed, className: 'landing-float-tile top-[4%] right-[4%] rotate-2' },
  { title: 'QuickConnect', sub: '12 leads', icon: IdCard, className: 'landing-float-tile bottom-[28%] left-[2%] rotate-1' },
  { title: 'Quick CRM', sub: '8 follow-ups', icon: Users, className: 'landing-float-tile bottom-[12%] right-[6%] -rotate-2' },
  { title: 'QuickDesign', sub: 'Posters', icon: Palette, className: 'landing-float-tile bottom-[4%] left-[28%] rotate-0' },
];

export function ProductFloatVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]" aria-hidden>
      <div className="landing-blob absolute inset-[8%] rounded-full shadow-inner" />
      <div className="relative h-full w-full">
        {TILES.map(({ title, sub, icon: Icon, className }) => (
          <div
            key={title}
            className={`absolute flex min-w-[130px] items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm ${className}`}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-ink">{title}</p>
              <p className="text-[9px] text-muted">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

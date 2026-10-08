import { IdCard, Star, UtensilsCrossed } from 'lucide-react';

const STATS = [
  { label: 'Page views', value: '248' },
  { label: 'Star taps', value: '86' },
  { label: 'Google opens', value: '42' },
];

export function LandingDashboardScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper pt-3">
      <div className="px-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Dashboard</p>
        <p className="font-display text-sm font-bold text-ink">Sunrise Café</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 px-3">
        {STATS.map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-white p-2">
            <p className="text-[8px] font-semibold uppercase text-muted">{card.label}</p>
            <p className="mt-0.5 text-sm font-extrabold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 px-3 pb-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Products</p>
        {[
          { title: 'QuickReview', icon: Star, active: true },
          { title: 'Quick Commerce', icon: UtensilsCrossed, active: true },
          { title: 'QuickConnect', icon: IdCard, active: false },
        ].map(({ title, icon: Icon, active }) => (
          <div
            key={title}
            className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-brand">
              <Icon className="h-3 w-3" />
            </span>
            <span className="flex-1 text-[10px] font-semibold text-ink">{title}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                active ? 'bg-brand/10 text-brand-dark' : 'bg-paper text-muted'
              }`}
            >
              {active ? 'Live' : 'Setup'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { BrandMark } from '../../BrandMark';

const ITEMS = [
  { name: 'Masala Dosa', price: '₹120', veg: true },
  { name: 'Filter Coffee', price: '₹45', veg: true },
  { name: 'Chicken Biryani', price: '₹220', veg: false },
];

export function LandingMenuScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-2">
      <div className="px-3 pb-2">
        <BrandMark className="!h-6 max-w-[6.5rem]" />
        <h2 className="mt-2 font-display text-sm font-bold text-ink">Sunrise Café</h2>
        <p className="text-[10px] text-muted">Guest menu · scan to order</p>
      </div>

      <div className="flex-1 space-y-2 overflow-hidden px-3 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Popular</p>
        {ITEMS.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper/80 px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-ink">
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-sm border ${
                    item.veg ? 'border-green-600 bg-green-100' : 'border-red-600 bg-red-100'
                  }`}
                  aria-hidden
                />
                {item.name}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
              {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

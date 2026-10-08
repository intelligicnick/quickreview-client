const ROWS = [
  { name: 'Masala Dosa', price: '₹120', veg: true, rotate: '-rotate-2', x: 'translate-x-0' },
  { name: 'Filter Coffee', price: '₹45', veg: true, rotate: 'rotate-1', x: 'translate-x-3' },
  { name: 'Veg Thali', price: '₹180', veg: true, rotate: '-rotate-1', x: 'translate-x-1' },
];

export function MenuStackVisual() {
  return (
    <div className="relative flex h-full items-end justify-center overflow-hidden pb-4 pt-8" aria-hidden>
      <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-brand/25" />
      <div className="relative w-full max-w-[260px] space-y-2 px-4">
        {ROWS.map((row, i) => (
          <div
            key={row.name}
            className={`flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 shadow-md ${row.rotate} ${row.x} ${i === 1 ? 'z-10 scale-105' : ''}`}
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-ink">
              <span className="h-2 w-2 rounded-sm border border-green-600 bg-green-100" />
              {row.name}
            </span>
            <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
              {row.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

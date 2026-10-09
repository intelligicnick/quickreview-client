import { Bell, IdCard, Phone } from 'lucide-react';

export function ConnectCardVisual() {
  return (
    <div className="relative flex h-full items-center justify-center p-6" aria-hidden>
      <div className="absolute -left-6 bottom-4 h-28 w-28 rounded-full bg-brand/15 blur-2xl" />
      <div className="relative w-full max-w-[220px] rounded-2xl border border-line bg-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <IdCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold">Rajesh Kumar</p>
            <p className="text-[10px] text-muted">Sunrise Café</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <Phone className="h-3 w-3 shrink-0" />
          +91 98765 43210
        </p>
        <span className="mt-3 flex w-full justify-center rounded-xl bg-brand py-2 text-[11px] font-semibold text-white">
          Save contact
        </span>
      </div>
    </div>
  );
}

const FOLLOW_UPS = [
  { name: 'Priya S.', note: 'Quotation sent', due: 'Today' },
  { name: 'Amit K.', note: 'Menu photos', due: 'Tomorrow' },
  { name: 'Neha R.', note: 'Google review', due: 'Fri' },
] as const;

export function CrmFollowUpsVisual() {
  return (
    <div className="relative flex h-full items-center justify-center p-6" aria-hidden>
      <div className="absolute -right-4 top-6 h-24 w-24 rounded-full bg-brand/12 blur-2xl" />
      <ul className="relative w-full max-w-[240px] space-y-2">
        {FOLLOW_UPS.map((item) => (
          <li
            key={item.name}
            className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-[10px] font-bold text-brand">
              {item.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
              <p className="truncate text-[10px] text-muted">{item.note}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
              <Bell className="h-2.5 w-2.5" aria-hidden />
              {item.due}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

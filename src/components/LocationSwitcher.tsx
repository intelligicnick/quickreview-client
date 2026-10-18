import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { initialsFromName } from '../lib/initials';
import { useLocationContext } from '../lib/location-context';
import { cn } from '../lib/cn';

function locationLabel(row: { name: string; businessName: string }) {
  if (row.name.trim().toLowerCase() === row.businessName.trim().toLowerCase()) {
    return row.businessName;
  }
  return `${row.businessName} › ${row.name}`;
}

export function LocationSwitcher({ variant = 'sidebar' }: { variant?: 'sidebar' | 'compact' }) {
  const { locations, selected, setSelectedId, loading } = useLocationContext();

  if (loading && locations.length === 0) {
    return <div className="text-sm text-muted">Loading locations…</div>;
  }

  if (locations.length === 0) {
    return (
      <Link
        to="/app/businesses"
        className="inline-flex min-h-11 w-full items-center gap-2 rounded-[10px] border border-dashed border-line bg-white px-3 py-2 text-sm font-semibold text-brand hover:border-brand/40"
      >
        Add your first location
      </Link>
    );
  }

  const locationCount =
    selected ? locations.filter((l) => l.businessId === selected.businessId).length : locations.length;
  const displayName = selected?.businessName ?? selected?.name ?? 'Select location';
  const subline =
    locationCount > 1
      ? `${selected?.name ?? 'Location'} · ${locationCount} locations`
      : `${selected?.name ?? 'Location'}`;

  const selectClass = 'absolute inset-0 h-full w-full cursor-pointer opacity-0';

  return (
    <div className={cn('relative w-full', variant === 'sidebar' ? 'px-3 pb-3' : '')}>
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-[10px] border border-line bg-white',
          variant === 'sidebar' ? 'px-3 py-2.5' : 'px-2 py-2',
        )}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-dark"
          aria-hidden
        >
          {initialsFromName(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
          <p className="truncate text-xs text-muted">{subline}</p>
        </div>
        <ChevronDown className="h-[18px] w-[18px] shrink-0 text-muted stroke-[1.8]" aria-hidden />
        <label className="absolute inset-0">
          <span className="sr-only">Selected location</span>
          <select
            value={selected?.id ?? ''}
            onChange={(event) => setSelectedId(event.target.value || null)}
            className={selectClass}
          >
            {locations.map((row) => (
              <option key={row.id} value={row.id}>
                {locationLabel(row)}
                {row.status === 'INACTIVE' ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

import { ChevronDown, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocationContext } from '../lib/location-context';

export function LocationSwitcher({ compact = false }: { compact?: boolean }) {
  const { locations, selected, setSelectedId, loading } = useLocationContext();

  if (loading && locations.length === 0) {
    return (
      <div className="text-sm text-muted">{compact ? 'Loading…' : 'Loading locations…'}</div>
    );
  }

  if (locations.length === 0) {
    return (
      <Link
        to="/app/businesses"
        className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-dashed border-line bg-white px-3 py-2 text-sm font-semibold text-brand hover:border-brand/40"
      >
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="truncate">Add your first shop</span>
      </Link>
    );
  }

  return (
    <label className={compact ? 'block w-full max-w-xs' : 'relative inline-block max-w-md'}>
      <span className="sr-only">Selected location</span>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <select
          value={selected?.id ?? ''}
          onChange={(event) => setSelectedId(event.target.value || null)}
          className={`w-full appearance-none rounded-xl border border-line bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-ink outline-none ring-brand/20 focus:border-brand focus:ring-4 ${
            compact ? 'min-h-11' : 'min-h-10'
          }`}
        >
          {locations.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name} · {row.businessName}
              {row.status === 'INACTIVE' ? ' (inactive)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </label>
  );
}

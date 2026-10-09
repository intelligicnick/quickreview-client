import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';

type PickRow = {
  id: string;
  name: string;
  business: { name: string };
};

type Props = {
  value: string;
  onChange: (locationId: string, row: PickRow | null) => void;
  placeholder?: string;
};

export function LocationPicker({ value, onChange, placeholder = 'Search merchant or location' }: Props) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<PickRow[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setRows([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await api<PickRow[]>(`/api/admin/locations?q=${encodeURIComponent(query.trim())}`);
          setRows(data.slice(0, 8));
          setError(null);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Search failed');
        }
      })();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  const selected = rows.find((row) => row.id === value);

  return (
    <div className="relative">
      <input
        value={open ? query : selected ? `${selected.business.name} · ${selected.name}` : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange('', null);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none ring-brand/20 focus:border-brand focus:ring-4"
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {open && rows.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-paper"
                onClick={() => {
                  onChange(row.id, row);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="font-semibold">{row.business.name}</span>
                <span className="block text-muted">{row.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

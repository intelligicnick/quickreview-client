import { useEffect, useState } from 'react';
import type { PriceVariant } from '../../lib/menu-pricing';

type Props = {
  variants: PriceVariant[];
  busy?: boolean;
  onSave: (names: { id?: string; name: string }[]) => void | Promise<void>;
};

export function CategoryPriceVariantsEditor({ variants, busy = false, onSave }: Props) {
  const [rows, setRows] = useState<{ id?: string; name: string }[]>(() =>
    variants.map((v) => ({ id: v.id, name: v.name })),
  );
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setRows(variants.map((v) => ({ id: v.id, name: v.name })));
  }, [variants]);

  return (
    <div className="mt-3 rounded-xl border border-dashed border-line bg-paper/60 px-3 py-3">
      <p className="text-xs font-semibold text-muted">Sizes / portions (prices per item)</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row, index) => (
          <li key={row.id ?? `new-${index}`} className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
              value={row.name}
              disabled={busy}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                )
              }
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              className="rounded-lg px-2 text-xs font-semibold text-muted hover:bg-red-50 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          className="min-w-[8rem] flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
          placeholder="e.g. Small, 22K, Half"
          value={newName}
          disabled={busy}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !newName.trim()}
          onClick={() => {
            const name = newName.trim();
            if (!name) return;
            setRows((prev) => [...prev, { name }]);
            setNewName('');
          }}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
        >
          Add size
        </button>
        <button
          type="button"
          disabled={busy || rows.some((r) => !r.name.trim())}
          onClick={() =>
            void onSave(rows.map((r) => ({ id: r.id, name: r.name.trim() })).filter((r) => r.name))
          }
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Save sizes
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Leave empty for a single price per item. Restaurants get Half / Full on new categories automatically.
      </p>
    </div>
  );
}

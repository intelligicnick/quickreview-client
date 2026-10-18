import { useMemo, useState } from 'react';
import { Star, X } from 'lucide-react';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from '../menu/MenuItemImageCarousel';
type OfferItem = {
  id: string;
  name: string;
  priceLabel: string;
  categoryName: string;
  imageUrls?: string[];
  imageUrl?: string | null;
};

type Props = {
  featuredTabLabel: string;
  itemLabel: string;
  imagePlaceholder: MenuImagePlaceholder;
  featured: OfferItem[];
  candidates: OfferItem[];
  onAdd: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

export function CatalogOffersSection({
  featuredTabLabel,
  itemLabel,
  imagePlaceholder,
  featured,
  candidates,
  onAdd,
  onRemove,
}: Props) {
  const [pickId, setPickId] = useState('');

  const pickOptions = useMemo(
    () => candidates.filter((row) => !featured.some((f) => f.id === row.id)),
    [candidates, featured],
  );

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-muted">
        Products you add here appear under <span className="font-semibold text-ink">{featuredTabLabel}</span>{' '}
        on your guest menu.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="font-semibold text-ink">Add {itemLabel.toLowerCase()}</span>
          <select
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
          >
            <option value="">Choose from your catalogue…</option>
            {pickOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} · {row.categoryName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!pickId}
          onClick={() => {
            onAdd(pickId);
            setPickId('');
          }}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add to {featuredTabLabel.toLowerCase()}
        </button>
      </div>

      {featured.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper px-5 py-10 text-center">
          <Star className="mx-auto h-8 w-8 text-muted/40" aria-hidden />
          <p className="mt-3 font-semibold text-ink">No offers yet</p>
          <p className="mt-1 text-sm text-muted">Pick a product above to highlight it for guests.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {featured.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm"
            >
              <MenuItemImageCarousel
                imageUrls={row.imageUrls}
                imageUrl={row.imageUrl}
                alt={row.name}
                placeholder={imagePlaceholder}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{row.name}</p>
                <p className="text-xs text-muted">{row.categoryName}</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">{row.priceLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-line px-3 text-xs font-semibold text-ink hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

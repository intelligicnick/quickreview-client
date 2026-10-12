import { GripVertical, MoreVertical, Pencil } from 'lucide-react';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from '../menu/MenuItemImageCarousel';
import { ToggleSwitch } from './ToggleSwitch';

type Props = {
  name: string;
  description: string | null;
  priceLabel: string;
  imageUrls?: string[];
  imageUrl?: string | null;
  imagePlaceholder: MenuImagePlaceholder;
  showVegBadge: boolean;
  isNonVeg: boolean;
  isAvailable: boolean;
  onToggleAvailable: (next: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
};

export function CatalogItemCard({
  name,
  description,
  priceLabel,
  imageUrls,
  imageUrl,
  imagePlaceholder,
  showVegBadge,
  isNonVeg,
  isAvailable,
  onToggleAvailable,
  onEdit,
  onRemove,
}: Props) {
  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <div className="flex items-center text-muted/50" aria-hidden>
        <GripVertical className="h-5 w-5" />
      </div>
      <MenuItemImageCarousel
        imageUrls={imageUrls}
        imageUrl={imageUrl}
        alt={name}
        placeholder={imagePlaceholder}
        size="md"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start gap-2">
          {showVegBadge ? (
            <span
              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                isNonVeg ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              title={isNonVeg ? 'Non-veg' : 'Veg'}
              aria-hidden
            />
          ) : (
            <span
              className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              title="Available"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-ink">{name}</p>
            {description ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{description}</p>
            ) : null}
            <p className="mt-1 text-sm font-bold tabular-nums text-ink">{priceLabel}</p>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
        <ToggleSwitch checked={isAvailable} onChange={onToggleAvailable} label="On menu" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold text-ink hover:border-brand/40"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"
            aria-label="Remove item"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

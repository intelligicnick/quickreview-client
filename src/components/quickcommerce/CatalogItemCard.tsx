import { useState } from 'react';
import { ChevronDown, GripVertical, Pencil } from 'lucide-react';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from '../menu/MenuItemImageCarousel';
import { formatInr, type MenuItemVariantRow } from '../../lib/menu-pricing';
import { CatalogActionMenu } from './CatalogActionMenu';
import { ToggleSwitch } from './ToggleSwitch';

type Props = {
  name: string;
  description: string | null;
  priceLabel: string;
  variantRows?: MenuItemVariantRow[];
  imageUrls?: string[];
  imageUrl?: string | null;
  imagePlaceholder: MenuImagePlaceholder;
  showVegBadge: boolean;
  isNonVeg: boolean;
  isAvailable: boolean;
  onToggleAvailable: (next: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
  isFeatured?: boolean;
  onToggleFeatured?: (next: boolean) => void;
};

export function CatalogItemCard({
  name,
  description,
  priceLabel,
  variantRows = [],
  imageUrls,
  imageUrl,
  imagePlaceholder,
  showVegBadge,
  isNonVeg,
  isAvailable,
  onToggleAvailable,
  onEdit,
  onRemove,
  isFeatured = false,
  onToggleFeatured,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = variantRows.length > 1;

  return (
    <div
      className={`rounded-2xl border border-line bg-white shadow-sm transition-shadow ${
        expanded && canExpand ? 'ring-1 ring-brand/20' : ''
      }`}
    >
      <div className="flex items-stretch gap-3 p-3">
        <div className="flex items-center text-muted/50" aria-hidden>
          <GripVertical className="h-5 w-5" />
        </div>
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => canExpand && setExpanded((value) => !value)}
          className={`flex min-w-0 flex-1 items-stretch gap-3 text-left ${
            canExpand ? 'cursor-pointer rounded-xl hover:bg-paper/80' : 'cursor-default'
          }`}
          aria-expanded={canExpand ? expanded : undefined}
        >
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
                <div className="flex items-start gap-1">
                  <p className="font-semibold leading-snug text-ink">{name}</p>
                  {canExpand ? (
                    <ChevronDown
                      className={`mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  ) : null}
                </div>
                {description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{description}</p>
                ) : null}
                <p className="mt-1 text-sm font-bold tabular-nums text-ink">{priceLabel}</p>
              </div>
            </div>
          </div>
        </button>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
          <ToggleSwitch
            checked={isAvailable}
            onChange={onToggleAvailable}
            label={isAvailable ? 'Showing' : 'Hidden'}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold text-ink hover:border-brand/40"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </button>
            <CatalogActionMenu
              ariaLabel={`Actions for ${name}`}
              actions={[
                ...(onToggleFeatured
                  ? [
                      isFeatured
                        ? {
                            label: 'Remove from offers',
                            onClick: () => onToggleFeatured(false),
                          }
                        : {
                            label: 'Add to offers',
                            onClick: () => onToggleFeatured(true),
                          },
                    ]
                  : []),
                isAvailable
                  ? {
                      label: 'Mark out of stock',
                      onClick: () => onToggleAvailable(false),
                    }
                  : {
                      label: 'Mark in stock',
                      onClick: () => onToggleAvailable(true),
                    },
                {
                  label: 'Delete',
                  danger: true,
                  onClick: () => {
                    if (window.confirm(`Delete "${name}"?`)) onRemove();
                  },
                },
              ]}
            />
          </div>
        </div>
      </div>
      {expanded && canExpand ? (
        <ul className="space-y-1.5 border-t border-line bg-paper/60 px-4 py-3">
          {variantRows.map((row) => (
            <li
              key={`${row.name}-${row.priceInr}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-medium text-ink">{row.name}</span>
              <span className="shrink-0 font-bold tabular-nums text-ink">{formatInr(row.priceInr)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

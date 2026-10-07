import { useMemo, useState } from 'react';
import {
  filterMenuCatalog,
  formatMenuItemPrice,
  formatMenuItemPriceDetail,
  itemPriceVariants,
  type PriceVariant,
  type PricedMenuItem,
} from '../../lib/menu-pricing';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from './MenuItemImageCarousel';
import { MenuCatalogBrowseToolbar } from './MenuCatalogBrowseToolbar';
import { BrandMark } from '../BrandMark';
import { GuestPreviewHeading, MobileScreenFrame } from '../MobileScreenFrame';

type MenuItem = PricedMenuItem & {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  isNonVeg: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
  priceVariants?: PriceVariant[];
  items: MenuItem[];
};

type MenuCopy = {
  pageTitle: string;
  showVegBadge: boolean;
  guestBrowse?: boolean;
};

type Props = {
  locationName: string;
  copy: MenuCopy;
  categories: MenuCategory[];
  imagePlaceholder?: MenuImagePlaceholder;
  locked?: boolean;
  priceVariantScope?: 'category' | 'product';
};

export function MenuGuestPreview({
  locationName,
  copy,
  categories,
  imagePlaceholder = 'retail',
  locked = false,
  priceVariantScope = 'product',
}: Props) {
  const categoryScoped = priceVariantScope === 'category';
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const visibleCategories = useMemo(() => {
    if (!copy.guestBrowse) return categories;
    return filterMenuCatalog(categories, search, categoryId);
  }, [categories, copy.guestBrowse, search, categoryId]);

  return (
    <div className="space-y-4">
      <GuestPreviewHeading />
      <MobileScreenFrame screenClassName="min-h-[36rem]">
        <div className="relative flex min-h-0 flex-1 flex-col bg-paper">
          {locked ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-paper/90 px-4 text-center backdrop-blur-[1px]"
              aria-hidden
            >
              <p className="text-sm font-semibold text-muted">Activate Quick Commerce to publish</p>
            </div>
          ) : null}

          <header className="flex shrink-0 justify-center py-3">
            <BrandMark className="h-6 opacity-80" />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{copy.pageTitle}</p>
              <h2 className="mt-0.5 text-lg font-extrabold leading-tight text-ink">{locationName}</h2>
            </div>

            {copy.guestBrowse ? (
              <MenuCatalogBrowseToolbar
                search={search}
                categoryId={categoryId}
                categories={categories}
                onSearchChange={setSearch}
                onCategoryChange={setCategoryId}
              />
            ) : null}

            <div className="mt-4 space-y-5">
              {visibleCategories.length === 0 ? (
                <p className="text-center text-xs text-muted">
                  {copy.guestBrowse && (search.trim() || categoryId !== 'all')
                    ? 'No products match your search.'
                    : 'Nothing listed yet.'}
                </p>
              ) : (
                visibleCategories.map((category) => (
                  <section key={category.id}>
                    <h3 className="border-b border-line pb-1 text-sm font-bold">{category.name}</h3>
                    <ul className="mt-2 space-y-2.5">
                      {category.items.map((item) => {
                        const variants = itemPriceVariants(
                          item,
                          category.priceVariants ?? [],
                          categoryScoped,
                        );
                        const price = formatMenuItemPrice(item);
                        const detail =
                          variants.length > 1 && item.variantPrices?.length
                            ? formatMenuItemPriceDetail(item, variants)
                            : null;
                        return (
                          <li key={item.id} className="flex gap-2 text-left">
                            <MenuItemImageCarousel
                              imageUrls={item.imageUrls}
                              imageUrl={item.imageUrl}
                              alt={item.name}
                              placeholder={imagePlaceholder}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold leading-snug">
                                {copy.showVegBadge ? (
                                  <span
                                    className={`mr-1.5 inline-block h-2 w-2 rounded-sm border ${
                                      item.isNonVeg
                                        ? 'border-red-700 bg-red-600'
                                        : 'border-green-700 bg-green-600'
                                    }`}
                                    aria-hidden
                                  />
                                ) : null}
                                {item.name}
                              </p>
                              {item.description ? (
                                <p className="mt-0.5 text-[11px] leading-snug text-muted">{item.description}</p>
                              ) : null}
                            </div>
                            {price !== '—' ? (
                              <p className="shrink-0 text-right text-[13px] font-semibold tabular-nums">
                                {price}
                                {detail && detail !== price ? (
                                  <span className="mt-0.5 block text-[10px] font-normal text-muted">
                                    {detail}
                                  </span>
                                ) : null}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      </MobileScreenFrame>
    </div>
  );
}

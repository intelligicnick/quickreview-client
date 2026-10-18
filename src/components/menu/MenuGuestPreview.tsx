import { useMemo, useState } from 'react';
import { BookOpen, Star } from 'lucide-react';
import {
  filterMenuCatalog,
  formatMenuItemPrice,
  formatMenuItemPriceDetail,
  itemPriceVariants,
  type PriceVariant,
  type PricedMenuItem,
} from '../../lib/menu-pricing';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from './MenuItemImageCarousel';
import { MenuCatalogBanner } from './MenuCatalogBanner';
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
  isAvailable?: boolean;
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
  address?: string | null;
  phone?: string | null;
  copy: MenuCopy;
  categories: MenuCategory[];
  imagePlaceholder?: MenuImagePlaceholder;
  locked?: boolean;
  priceVariantScope?: 'category' | 'product';
  activeCategoryId?: string | null;
  featuredTabLabel?: string;
};

function FeaturedPreviewCard({
  item,
  category,
  copy,
  imagePlaceholder,
  categoryScoped,
}: {
  item: MenuItem;
  category: MenuCategory;
  copy: MenuCopy;
  imagePlaceholder: MenuImagePlaceholder;
  categoryScoped: boolean;
}) {
  const variants = itemPriceVariants(item, category.priceVariants ?? [], categoryScoped);
  const price = formatMenuItemPrice(item);
  return (
    <div className="rounded-2xl bg-brand/8 p-3">
      <div className="flex gap-2.5">
        <MenuItemImageCarousel
          imageUrls={item.imageUrls}
          imageUrl={item.imageUrl}
          alt={item.name}
          placeholder={imagePlaceholder}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-[13px] font-semibold leading-snug">
              {copy.showVegBadge ? (
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                    item.isNonVeg ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  aria-hidden
                />
              ) : null}
              {item.name}
            </p>
            {price !== '—' ? (
              <p className="shrink-0 text-[13px] font-bold tabular-nums">{price}</p>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{item.description}</p>
          ) : null}
          {variants.length > 1 && item.variantPrices?.length ? (
            <p className="mt-0.5 text-[10px] text-muted">
              {formatMenuItemPriceDetail(item, variants)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MenuGuestPreview({
  locationName,
  address = null,
  phone,
  copy,
  categories,
  imagePlaceholder = 'retail',
  locked = false,
  priceVariantScope = 'product',
  activeCategoryId = null,
  featuredTabLabel = "Today's Special",
}: Props) {
  const categoryScoped = priceVariantScope === 'category';
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);

  const pillCategoryId = activeCategoryId ?? previewCategoryId ?? categories[0]?.id ?? null;

  const visibleCategories = useMemo(() => {
    if (!copy.guestBrowse) {
      if (pillCategoryId) {
        const row = categories.find((c) => c.id === pillCategoryId);
        return row ? [row] : categories;
      }
      return categories;
    }
    return filterMenuCatalog(categories, search, categoryId);
  }, [categories, copy.guestBrowse, search, categoryId, pillCategoryId]);

  const featuredItem = useMemo(() => {
    for (const category of categories) {
      const item = category.items.find((row) => row.isAvailable !== false);
      if (item) return { item, category };
    }
    return null;
  }, [categories]);

  return (
    <div className="space-y-3">
      <GuestPreviewHeading>Live guest preview</GuestPreviewHeading>
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

          <MenuCatalogBanner
            pageTitle={copy.pageTitle}
            locationName={locationName}
            address={address}
            phone={phone ?? null}
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-16 pt-3">
            {categories.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  {featuredTabLabel}
                </button>
                {categories.map((category) => {
                  const active = category.id === pillCategoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setPreviewCategoryId(category.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        active ? 'bg-ink text-white' : 'border border-line bg-white text-ink'
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {copy.guestBrowse ? (
              <MenuCatalogBrowseToolbar
                search={search}
                categoryId={categoryId}
                categories={categories}
                onSearchChange={setSearch}
                onCategoryChange={setCategoryId}
              />
            ) : null}

            {featuredItem ? (
              <section className="mt-4">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-brand">
                  <Star className="h-4 w-4 fill-brand/20" aria-hidden />
                  {featuredTabLabel}
                </h3>
                <div className="mt-2">
                  <FeaturedPreviewCard
                    item={featuredItem.item}
                    category={featuredItem.category}
                    copy={copy}
                    imagePlaceholder={imagePlaceholder}
                    categoryScoped={categoryScoped}
                  />
                </div>
              </section>
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
                    <h3 className="text-sm font-bold text-ink">{category.name}</h3>
                    <ul className="mt-2 space-y-2.5">
                      {category.items
                        .filter((item) => item.isAvailable !== false)
                        .map((item) => {
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
                            <li
                              key={item.id}
                              className="flex gap-2 rounded-xl border border-line/80 bg-white p-2 text-left shadow-sm"
                            >
                              <MenuItemImageCarousel
                                imageUrls={item.imageUrls}
                                imageUrl={item.imageUrl}
                                alt={item.name}
                                placeholder={imagePlaceholder}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="min-w-0 text-[13px] font-semibold leading-snug">
                                    {copy.showVegBadge ? (
                                      <span
                                        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                                          item.isNonVeg ? 'bg-red-500' : 'bg-emerald-500'
                                        }`}
                                        aria-hidden
                                      />
                                    ) : null}
                                    {item.name}
                                  </p>
                                  {price !== '—' ? (
                                    <p className="shrink-0 text-right text-[13px] font-bold tabular-nums whitespace-nowrap">
                                      {price}
                                    </p>
                                  ) : null}
                                </div>
                                {item.description ? (
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                                    {item.description}
                                  </p>
                                ) : null}
                                {detail && detail !== price ? (
                                  <p className="mt-0.5 text-[10px] leading-snug text-muted">{detail}</p>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-10 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white shadow-lg">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {copy.pageTitle}
            </span>
          </div>

          <footer className="shrink-0 border-t border-line/80 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
              Powered by <BrandMark className="inline h-3 align-middle opacity-70" />
            </p>
          </footer>
        </div>
      </MobileScreenFrame>
    </div>
  );
}

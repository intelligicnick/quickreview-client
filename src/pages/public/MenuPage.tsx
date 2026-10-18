import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Repeat, Star } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { BrandMark } from '../../components/BrandMark';
import { MenuCatalogBanner } from '../../components/menu/MenuCatalogBanner';
import { MenuCatalogBrowseToolbar } from '../../components/menu/MenuCatalogBrowseToolbar';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from '../../components/menu/MenuItemImageCarousel';
import {
  filterMenuCatalog,
  formatMenuItemPrice,
  formatMenuItemPriceDetail,
  itemPriceVariants,
  type PriceVariant,
  type PricedMenuItem,
} from '../../lib/menu-pricing';

type PublicMenu = {
  quickRevisitPath?: string | null;
  catalogBannerUrl?: string | null;
  locationName: string;
  address: string | null;
  phone: string | null;
  presentation?: string;
  copy: {
    pageTitle: string;
    showVegBadge: boolean;
    guestBrowse?: boolean;
    featuredTabLabel?: string;
  };
  imagePlaceholder?: MenuImagePlaceholder;
  priceVariantScope?: 'category' | 'product';
  categories: Array<{
    id: string;
    name: string;
    priceVariants?: PriceVariant[];
    items: Array<
      PricedMenuItem & {
        id: string;
        name: string;
        description: string | null;
        imageUrl?: string | null;
        imageUrls?: string[];
        isNonVeg: boolean;
        isFeatured?: boolean;
      }
    >;
  }>;
};

export function MenuPage() {
  const { slug = '' } = useParams();
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<PublicMenu>(`/api/public/menu/${encodeURIComponent(slug)}`, { auth: false });
        if (!cancelled) {
          setMenu(data);
          setLocked(false);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 402) setLocked(true);
          setError(err instanceof ApiError ? err.message : 'This menu is not available');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const categoryScoped = menu?.priceVariantScope === 'category';
  const visibleCategories = useMemo(() => {
    if (!menu) return [];
    if (!menu.copy.guestBrowse) return menu.categories;
    return filterMenuCatalog(menu.categories, search, categoryId);
  }, [menu, search, categoryId]);

  const featuredItems = useMemo(() => {
    if (!menu) return [];
    const rows: {
      item: PublicMenu['categories'][number]['items'][number];
      category: PublicMenu['categories'][number];
    }[] = [];
    for (const category of menu.categories) {
      for (const item of category.items) {
        if (item.isFeatured) rows.push({ item, category });
      }
    }
    return rows;
  }, [menu]);

  const featuredTabLabel = menu?.copy.featuredTabLabel ?? "Today's Special";

  if (locked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 text-center">
        <BrandMark className="h-8" />
        <p className="mt-6 max-w-sm text-sm text-muted">
          This page is not published yet. The business needs an active Quick Commerce plan.
        </p>
      </div>
    );
  }

  if (!menu && !error) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted">Loading…</div>;
  }

  if (!menu) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 text-center">
        <BrandMark className="h-8" />
        <p className="mt-6 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper pb-12">
      <header className="relative flex justify-center border-b border-line/80 bg-white px-4 py-4">
        {menu.quickRevisitPath ? (
          <Link
            to={menu.quickRevisitPath}
            className="absolute right-4 top-4 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:border-brand/40"
          >
            <Repeat className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Quick Revisit
          </Link>
        ) : null}
        <BrandMark className="h-7 opacity-80" />
      </header>

      <MenuCatalogBanner
        pageTitle={menu.copy.pageTitle}
        locationName={menu.locationName}
        address={menu.address}
        phone={menu.phone}
        bannerImageUrl={menu.catalogBannerUrl}
      />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {menu.copy.guestBrowse ? (
          <MenuCatalogBrowseToolbar
            search={search}
            categoryId={categoryId}
            categories={menu.categories}
            onSearchChange={setSearch}
            onCategoryChange={setCategoryId}
          />
        ) : null}

        <div className="mt-8 space-y-8">
          {featuredItems.length > 0 ? (
            <section>
              <h2 className="flex items-center gap-2 border-b border-line pb-2 text-lg font-bold">
                <Star className="h-5 w-5 text-brand" aria-hidden />
                {featuredTabLabel}
              </h2>
              <ul className="mt-3 space-y-4">
                {featuredItems.map(({ item, category }) => {
                  const variants = itemPriceVariants(
                    item,
                    category.priceVariants ?? [],
                    categoryScoped ?? false,
                  );
                  const price = formatMenuItemPrice(item);
                  const detail =
                    variants.length > 1 && item.variantPrices?.length
                      ? formatMenuItemPriceDetail(item, variants)
                      : null;
                  return (
                    <li key={item.id} className="flex gap-3 rounded-2xl bg-brand/5 p-3">
                      <MenuItemImageCarousel
                        imageUrls={item.imageUrls}
                        imageUrl={item.imageUrl}
                        alt={item.name}
                        placeholder={menu.imagePlaceholder ?? 'retail'}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 font-semibold">{item.name}</p>
                          {price !== '—' ? (
                            <p className="shrink-0 text-right font-semibold tabular-nums whitespace-nowrap">
                              {price}
                            </p>
                          ) : null}
                        </div>
                        {item.description ? (
                          <p className="mt-1 text-sm text-muted">{item.description}</p>
                        ) : null}
                        {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {visibleCategories.map((category) => (
            <section key={category.id}>
              <h2 className="border-b border-line pb-2 text-lg font-bold">{category.name}</h2>
              <ul className="mt-3 space-y-4">
                {category.items.map((item) => {
                  const variants = itemPriceVariants(
                    item,
                    category.priceVariants ?? [],
                    categoryScoped ?? false,
                  );
                  const price = formatMenuItemPrice(item);
                  const detail =
                    variants.length > 1 && item.variantPrices?.length
                      ? formatMenuItemPriceDetail(item, variants)
                      : null;
                  return (
                    <li key={item.id} className="flex gap-3">
                      <MenuItemImageCarousel
                        imageUrls={item.imageUrls}
                        imageUrl={item.imageUrl}
                        alt={item.name}
                        placeholder={menu.imagePlaceholder ?? 'retail'}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 font-semibold">
                            {menu.copy.showVegBadge ? (
                              <span
                                className={`mr-2 inline-block h-2.5 w-2.5 rounded-sm border ${
                                  item.isNonVeg
                                    ? 'border-red-700 bg-red-600'
                                    : 'border-green-700 bg-green-600'
                                }`}
                                aria-hidden
                              />
                            ) : null}
                            {item.name}
                          </p>
                          {price !== '—' ? (
                            <p className="shrink-0 text-right font-semibold tabular-nums whitespace-nowrap">
                              {price}
                            </p>
                          ) : null}
                        </div>
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.description}</p>
                        ) : null}
                        {detail && detail !== price ? (
                          <p className="mt-0.5 text-xs leading-snug text-muted">{detail}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {visibleCategories.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            {menu.copy.guestBrowse && (search.trim() || categoryId !== 'all')
              ? 'No products match your search.'
              : 'Nothing listed yet — check back soon.'}
          </p>
        ) : null}
      </main>
    </div>
  );
}

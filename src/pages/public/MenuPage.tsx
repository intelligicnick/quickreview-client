import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Repeat } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { BrandMark } from '../../components/BrandMark';
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
  locationName: string;
  address: string | null;
  phone: string | null;
  presentation?: string;
  copy: { pageTitle: string; showVegBadge: boolean; guestBrowse?: boolean };
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
      <header className="relative flex justify-center px-4 py-6">
        {menu.quickRevisitPath ? (
          <Link
            to={menu.quickRevisitPath}
            className="absolute right-4 top-5 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:border-brand/40"
          >
            <Repeat className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Quick Revisit
          </Link>
        ) : null}
        <BrandMark className="h-7 opacity-80" />
      </header>
      <main className="mx-auto max-w-lg px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{menu.copy.pageTitle}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{menu.locationName}</h1>
          {menu.address ? <p className="mt-1 text-sm text-muted">{menu.address}</p> : null}
          {menu.phone ? (
            <a href={`tel:${menu.phone.replace(/\s/g, '')}`} className="mt-2 inline-block text-sm font-semibold text-brand">
              {menu.phone}
            </a>
          ) : null}
        </div>

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
                      <div className="flex-1">
                        <p className="font-semibold">
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
                        {item.description ? (
                          <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                        ) : null}
                      </div>
                      {price !== '—' ? (
                        <p className="shrink-0 text-right font-semibold tabular-nums">
                          {price}
                          {detail && detail !== price ? (
                            <span className="mt-0.5 block text-xs font-normal text-muted">{detail}</span>
                          ) : null}
                        </p>
                      ) : null}
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

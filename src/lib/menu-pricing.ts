export type PriceVariant = { id: string; name: string; sortOrder: number };

export type VariantPrice = { variantId: string; priceInr: number };

export type PricedMenuItem = {
  priceInr: number | null;
  isMultiPriced?: boolean;
  displayPriceInr?: number | null;
  maxPriceInr?: number | null;
  variantPrices?: VariantPrice[];
  priceVariants?: PriceVariant[];
};

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatMenuItemPrice(item: PricedMenuItem): string {
  const display = item.displayPriceInr ?? item.priceInr;
  if (display === null || display === undefined) return '—';
  if (item.isMultiPriced && item.maxPriceInr != null && item.maxPriceInr > display) {
    return `${formatInr(display)} – ${formatInr(item.maxPriceInr)}`;
  }
  if (item.isMultiPriced) return `From ${formatInr(display)}`;
  return formatInr(display);
}

export function itemPriceVariants(
  item: PricedMenuItem,
  categoryVariants: PriceVariant[],
  categoryScoped: boolean,
): PriceVariant[] {
  if (categoryScoped) return categoryVariants;
  return item.priceVariants ?? [];
}

export function formatMenuItemPriceDetail(
  item: PricedMenuItem,
  variants: PriceVariant[],
): string {
  if (!variants.length || !item.variantPrices?.length) {
    return formatMenuItemPrice(item);
  }
  const byId = new Map(variants.map((v) => [v.id, v.name]));
  return item.variantPrices
    .map((row) => {
      const label = byId.get(row.variantId) ?? 'Price';
      return `${label} ${formatInr(row.priceInr)}`;
    })
    .join(' · ');
}

export type CatalogCategory = {
  id: string;
  name: string;
  items: Array<{ name: string; description?: string | null }>;
};

export function filterMenuCatalog<T extends CatalogCategory>(
  categories: T[],
  search: string,
  categoryId: string | 'all',
): T[] {
  const q = search.trim().toLowerCase();
  return categories
    .filter((category) => categoryId === 'all' || category.id === categoryId)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        if (!q) return true;
        if (item.name.toLowerCase().includes(q)) return true;
        return item.description?.toLowerCase().includes(q) ?? false;
      }),
    }))
    .filter((category) => category.items.length > 0 || (categoryId !== 'all' && category.id === categoryId));
}

export function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function variantPricesFromDraft(
  variants: PriceVariant[],
  singlePrice: string,
  byVariant: Record<string, string>,
): VariantPrice[] | null {
  if (!variants.length) {
    const price = parsePriceInput(singlePrice);
    return price === null ? null : [];
  }
  if (variants.length === 1) {
    const price = parsePriceInput(byVariant[variants[0]!.id] ?? singlePrice);
    if (price === null) return null;
    return [{ variantId: variants[0]!.id, priceInr: price }];
  }
  const rows: VariantPrice[] = [];
  for (const variant of variants) {
    const price = parsePriceInput(byVariant[variant.id] ?? '');
    if (price === null) return null;
    rows.push({ variantId: variant.id, priceInr: price });
  }
  return rows;
}

export type ProductOptionDraft = { id?: string; name: string; price: string };

export function itemPriceOptionsFromDraft(
  options: ProductOptionDraft[],
  singlePrice: string,
): { id?: string; name: string; priceInr: number }[] | null {
  const rows = options.filter((row) => row.name.trim());
  if (!rows.length) {
    const price = parsePriceInput(singlePrice);
    return price === null ? null : [];
  }
  const out: { id?: string; name: string; priceInr: number }[] = [];
  for (const row of rows) {
    const priceInr = parsePriceInput(row.price);
    if (priceInr === null) return null;
    out.push({ id: row.id, name: row.name.trim(), priceInr });
  }
  return out;
}

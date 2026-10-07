import type { CatalogItem, CrmState } from './types';

export type CommerceMenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceInr: number | null;
};

export type CommerceCategory = {
  id: string;
  name: string;
  items: CommerceMenuItem[];
};

/** Map Quick Commerce menu hub categories into CRM catalog rows. */
export function mergeCommerceCatalog(
  state: CrmState,
  categories: CommerceCategory[],
  locationId: string,
): { added: number; updated: number } {
  let added = 0;
  let updated = 0;
  const byCommerceId = new Map(
    state.catalog.filter((c) => c.commerceItemId).map((c) => [c.commerceItemId!, c]),
  );

  for (const cat of categories) {
    for (const item of cat.items) {
      if (!item.name) continue;
      const price = item.priceInr ?? 0;
      const existing = byCommerceId.get(item.id);
      if (existing) {
        existing.name = item.name;
        existing.description = item.description ?? undefined;
        existing.price = price;
        existing.commerceCategory = cat.name;
        updated += 1;
      } else {
        const row: CatalogItem = {
          id: crypto.randomUUID(),
          kind: 'product',
          name: item.name,
          description: item.description ?? undefined,
          price,
          taxPercent: 18,
          unit: 'unit',
          commerceItemId: item.id,
          commerceCategory: cat.name,
        };
        state.catalog.push(row);
        byCommerceId.set(item.id, row);
        added += 1;
      }
    }
  }

  state.commerceSync = {
    lastSyncedAt: new Date().toISOString(),
    locationId,
    itemCount: state.catalog.filter((c) => c.commerceItemId).length,
  };
  return { added, updated };
}

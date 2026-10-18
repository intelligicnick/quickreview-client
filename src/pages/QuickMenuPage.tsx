import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, MoreVertical, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { MenuImagePlaceholder } from '../components/menu/MenuItemImageCarousel';
import { MenuGuestPreview } from '../components/menu/MenuGuestPreview';
import { MenuItemPhotoUpload } from '../components/quickcommerce/MenuItemPhotoUpload';
import { CatalogCategoryPills } from '../components/quickcommerce/CatalogCategoryPills';
import { CatalogItemCard } from '../components/quickcommerce/CatalogItemCard';
import { CatalogWorkspaceTabs } from '../components/quickcommerce/CatalogWorkspaceTabs';
import { CategoryPriceVariantsEditor } from '../components/quickcommerce/CategoryPriceVariantsEditor';
import { ItemPriceVariantsEditor } from '../components/quickcommerce/ItemPriceVariantsEditor';
import { MenuItemPriceInputs } from '../components/quickcommerce/MenuItemPriceInputs';
import { CatalogBulkImport } from '../components/quickcommerce/CatalogBulkImport';
import { QuickCommerceOnboarding } from '../components/quickcommerce/QuickCommerceOnboarding';
import { QrProductCard } from '../components/QrProductCard';
import { productStatusLabel } from '../lib/location-workspace';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';
import {
  formatMenuItemPrice,
  itemPriceOptionsFromDraft,
  itemPriceVariants,
  parsePriceInput,
  type PriceVariant,
  type ProductOptionDraft,
  variantPricesFromDraft,
} from '../lib/menu-pricing';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceInr: number | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  isNonVeg: boolean;
  isAvailable: boolean;
  isMultiPriced?: boolean;
  displayPriceInr?: number | null;
  variantPrices?: { variantId: string; priceInr: number }[];
  priceVariants?: PriceVariant[];
};

type MenuCategory = {
  id: string;
  name: string;
  priceVariants: PriceVariant[];
  items: MenuItem[];
};

type ItemDraft = {
  name: string;
  price: string;
  isNonVeg: boolean;
  variantPrices: Record<string, string>;
  productOptions: ProductOptionDraft[];
};

function emptyItemDraft(): ItemDraft {
  return { name: '', price: '', isNonVeg: false, variantPrices: {}, productOptions: [] };
}

type CatalogTab = { id: string; label: string; enabled: boolean };

type MenuCopy = {
  productName: string;
  moduleSubtitle: string;
  pageTitle: string;
  categoryLabel: string;
  categoryLabelPlural: string;
  itemLabel: string;
  itemLabelPlural: string;
  addCategory: string;
  addItem: string;
  emptyHint: string;
  showVegBadge: boolean;
  guestBrowse?: boolean;
  tabs: CatalogTab[];
};

type Hub = {
  slug: string;
  menuMode: string;
  businessCategory: string | null;
  businessSubcategories: string[];
  needsOnboarding: boolean;
  onboardingOptions: { id: string; emoji: string; title: string; subtitle: string }[];
  publicPath: string;
  publicUrl: string;
  menuUnlocked: boolean;
  menuAccess: { status: string };
  copy: MenuCopy;
  priceVariantScope: 'category' | 'product';
  imagePlaceholder: MenuImagePlaceholder;
  categories: MenuCategory[];
};

function categoryLabel(
  options: Hub['onboardingOptions'],
  id: string | null | undefined,
): { emoji: string; title: string } | null {
  if (!id) return null;
  const row = options.find((o) => o.id === id);
  return row ? { emoji: row.emoji, title: row.title } : { emoji: '📦', title: id };
}

export function QuickMenuPage() {
  const { selected } = useLocationContext();
  const [hub, setHub] = useState<Hub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ItemDraft>(emptyItemDraft());
  const [workspaceTab, setWorkspaceTab] = useState('primary');
  const [changingCategory, setChangingCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAddCategoryField, setShowAddCategoryField] = useState(false);

  useEffect(() => {
    if (!selected) {
      setHub(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<Hub>(`/api/locations/${selected.id}/quickmenu`);
        if (!cancelled) {
          setHub(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load Quick Commerce');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (!hub?.categories.length) {
      setSelectedCategoryId(null);
      return;
    }
    if (!selectedCategoryId || !hub.categories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(hub.categories[0].id);
    }
  }, [hub?.categories, selectedCategoryId]);

  const unavailableCount = useMemo(() => {
    if (!hub) return 0;
    return hub.categories.reduce(
      (n, cat) => n + cat.items.filter((item) => !item.isAvailable).length,
      0,
    );
  }, [hub]);

  const workspaceTabs = useMemo(() => {
    const tabs = hub?.copy?.tabs;
    if (!tabs) return [];
    return tabs.map((tab) =>
      tab.id === 'unavailable'
        ? { ...tab, label: `${tab.label} (${unavailableCount})` }
        : tab,
    );
  }, [hub?.copy?.tabs, unavailableCount]);

  async function reload() {
    if (!selected) return;
    const data = await api<Hub>(`/api/locations/${selected.id}/quickmenu`);
    setHub(data);
  }

  async function saveSlug(slug: string) {
    if (!selected || !hub) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api<Hub>(`/api/locations/${selected.id}/quickmenu`, {
        method: 'PATCH',
        body: { slug },
      });
      setHub(data);
      setMessage('Link updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function completeOnboarding(primary: string, also: string[]) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api<Hub>(`/api/locations/${selected.id}/quickmenu/setup`, {
        method: 'POST',
        body: { businessCategory: primary, businessSubcategories: also },
      });
      setHub(data);
      setWorkspaceTab('primary');
      setChangingCategory(false);
      setMessage(changingCategory ? 'Business type updated' : 'QuickCommerce is ready');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Setup failed');
    } finally {
      setBusy(false);
    }
  }

  async function addCategory() {
    if (!selected || !newCategory.trim()) return;
    try {
      await api(`/api/locations/${selected.id}/quickmenu/categories`, {
        method: 'POST',
        body: { name: newCategory.trim() },
      });
      setNewCategory('');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add category');
    }
  }

  async function saveCategoryVariants(
    categoryId: string,
    priceVariants: { id?: string; name: string }[],
  ) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/locations/${selected.id}/quickmenu/categories/${categoryId}`, {
        method: 'PATCH',
        body: { priceVariants },
      });
      await reload();
      setMessage('Sizes updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save sizes');
    } finally {
      setBusy(false);
    }
  }

  async function removeCategory(categoryId: string) {
    if (!selected) return;
    try {
      await api(`/api/locations/${selected.id}/quickmenu/categories/${categoryId}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete');
    }
  }

  async function addItem(categoryId: string) {
    if (!selected || !hub) return;
    const category = hub.categories.find((row) => row.id === categoryId);
    if (!category) return;
    const draft = itemDrafts[categoryId] ?? emptyItemDraft();
    if (!draft.name.trim()) return;
    const categoryScoped = hub.priceVariantScope === 'category';
    const variants = category.priceVariants ?? [];

    let body: Record<string, unknown> = {
      name: draft.name.trim(),
      isNonVeg: draft.isNonVeg,
    };

    if (categoryScoped) {
      const variantPrices = variantPricesFromDraft(variants, draft.price, draft.variantPrices);
      if (variants.length > 0 && variantPrices === null) {
        setError('Enter a price for each size or portion');
        return;
      }
      body = {
        ...body,
        priceInr: variants.length === 0 ? parsePriceInput(draft.price) : undefined,
        variantPrices: variantPrices?.length ? variantPrices : undefined,
      };
    } else {
      const itemPriceOptions = itemPriceOptionsFromDraft(draft.productOptions, draft.price);
      if (itemPriceOptions === null) {
        setError('Enter a price for each variation');
        return;
      }
      body = {
        ...body,
        priceInr: itemPriceOptions.length === 0 ? parsePriceInput(draft.price) : undefined,
        itemPriceOptions: itemPriceOptions.length ? itemPriceOptions : undefined,
      };
    }

    try {
      await api(`/api/locations/${selected.id}/quickmenu/categories/${categoryId}/items`, {
        method: 'POST',
        body,
      });
      setItemDrafts((prev) => ({ ...prev, [categoryId]: emptyItemDraft() }));
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add item');
    }
  }

  function startEditItem(item: MenuItem, category: MenuCategory, categoryScoped: boolean) {
    setEditingItemId(item.id);
    const variants = itemPriceVariants(item, category.priceVariants ?? [], categoryScoped);
    const variantPrices: Record<string, string> = {};
    for (const row of item.variantPrices ?? []) {
      variantPrices[row.variantId] = String(row.priceInr);
    }
    const productOptions: ProductOptionDraft[] = categoryScoped
      ? []
      : (item.priceVariants ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          price: String(item.variantPrices?.find((p) => p.variantId === row.id)?.priceInr ?? ''),
        }));
    setEditDraft({
      name: item.name,
      price: item.priceInr != null ? String(item.priceInr) : '',
      isNonVeg: item.isNonVeg,
      variantPrices,
      productOptions,
    });
    if (categoryScoped && variants.length === 1 && item.variantPrices?.[0]) {
      setEditDraft((d) => ({
        ...d,
        price: String(item.variantPrices![0]!.priceInr),
      }));
    }
  }

  async function saveEditItem(category: MenuCategory) {
    if (!selected || !editingItemId || !hub) return;
    const categoryScoped = hub.priceVariantScope === 'category';
    const variants = category.priceVariants ?? [];

    let body: Record<string, unknown> = {
      name: editDraft.name.trim(),
      isNonVeg: editDraft.isNonVeg,
    };

    if (categoryScoped) {
      const variantPrices = variantPricesFromDraft(variants, editDraft.price, editDraft.variantPrices);
      if (variants.length > 0 && variantPrices === null) {
        setError('Enter a price for each size or portion');
        return;
      }
      body = {
        ...body,
        priceInr: variants.length === 0 ? parsePriceInput(editDraft.price) : undefined,
        variantPrices: variantPrices?.length ? variantPrices : undefined,
      };
    } else {
      const itemPriceOptions = itemPriceOptionsFromDraft(editDraft.productOptions, editDraft.price);
      if (itemPriceOptions === null) {
        setError('Enter a price for each variation');
        return;
      }
      body = {
        ...body,
        priceInr: itemPriceOptions.length === 0 ? parsePriceInput(editDraft.price) : undefined,
        itemPriceOptions: itemPriceOptions,
      };
    }

    try {
      await api(`/api/locations/${selected.id}/quickmenu/items/${editingItemId}`, {
        method: 'PATCH',
        body,
      });
      setEditingItemId(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save item');
    }
  }

  async function removeItem(itemId: string) {
    if (!selected) return;
    try {
      await api(`/api/locations/${selected.id}/quickmenu/items/${itemId}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete item');
    }
  }

  async function toggleItemAvailable(item: MenuItem, next: boolean) {
    if (!selected) return;
    try {
      await api(`/api/locations/${selected.id}/quickmenu/items/${item.id}`, {
        method: 'PATCH',
        body: { isAvailable: next },
      });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update item');
    }
  }

  const unlocked = hub?.menuUnlocked ?? false;
  const copy = hub?.copy;
  const imagePlaceholder = hub?.imagePlaceholder ?? 'retail';
  const categoryScoped = hub?.priceVariantScope === 'category';
  const activeCategory =
    hub?.categories.find((c) => c.id === selectedCategoryId) ?? hub?.categories[0] ?? null;
  const featuredTabLabel =
    hub?.copy?.tabs.find((t) => t.id === 'featured')?.label ?? "Today's Special";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <ShoppingBag className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            QuickCommerce
            {copy?.productName ? (
              <span className="font-semibold text-muted"> · {copy.productName}</span>
            ) : null}
          </h1>
          <p className="text-sm text-muted">
            {copy?.moduleSubtitle ?? 'Your digital catalogue'} — {selected ? selected.name : 'select a location'}.
          </p>
        </div>
      </div>

      {!selected ? (
        <p className="mt-6 text-sm text-muted">Select a location at the top to edit your catalogue.</p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">{message}</p>
      ) : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && hub && copy && (hub.needsOnboarding || changingCategory) ? (
        <QuickCommerceOnboarding
          key={changingCategory ? 'change' : 'setup'}
          options={hub.onboardingOptions}
          busy={busy}
          initialPrimary={hub.businessCategory}
          initialAlso={hub.businessSubcategories}
          title={changingCategory ? 'Change business type' : undefined}
          subtitle={
            changingCategory
              ? 'Pick a new primary type. Your catalogue items stay as they are.'
              : undefined
          }
          onCancel={changingCategory ? () => setChangingCategory(false) : undefined}
          onComplete={completeOnboarding}
        />
      ) : null}

      {selected && hub && copy && !hub.needsOnboarding && !changingCategory ? (
        <>
          {(() => {
            const active = categoryLabel(hub.onboardingOptions, hub.businessCategory);
            const extras = hub.businessSubcategories
              .map((id) => categoryLabel(hub.onboardingOptions, id))
              .filter(Boolean) as { emoji: string; title: string }[];
            if (!active) return null;
            return (
              <div
                className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-white px-4 py-3"
                role="status"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Active type</span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <span aria-hidden>{active.emoji}</span>
                  {active.title}
                </span>
                {extras.length > 0 ? (
                  <span className="text-sm text-muted">
                    · Also:{' '}
                    {extras.map((row, i) => (
                      <span key={row.title}>
                        {i > 0 ? ', ' : ''}
                        {row.emoji} {row.title}
                      </span>
                    ))}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setChangingCategory(true)}
                  className="ml-auto inline-flex min-h-9 items-center rounded-xl border border-line px-3 text-xs font-semibold text-ink hover:border-brand/40"
                >
                  Change
                </button>
              </div>
            );
          })()}
          {!unlocked ? (
            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Guest menu is locked.{' '}
                <Link to="/app/subscription" className="font-semibold underline">
                  Activate Quick Commerce
                </Link>{' '}
                to publish {hub.publicPath}.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
            <div className="min-w-0">
              <CatalogWorkspaceTabs
                tabs={workspaceTabs}
                activeId={workspaceTab}
                onChange={setWorkspaceTab}
              />

              {workspaceTab === 'qr' ? (
                <div className="mt-6 max-w-xl">
                  <QrProductCard
                    title="Commerce QR & link"
                    purpose="Guests scan to browse your catalogue"
                    publicUrl={hub.publicUrl}
                    publicPath={hub.publicPath}
                    unlocked={unlocked}
                    statusLabel={productStatusLabel(unlocked, hub.menuAccess.status)}
                    manageHref="/app/qr"
                    manageLabel="All QR codes"
                    unlockTo="/app/subscription"
                  />
                  <label className="mt-4 block rounded-2xl border border-line bg-white p-4 text-sm">
                    <span className="font-semibold">Custom slug</span>
                    <input
                      className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-mono text-sm"
                      defaultValue={hub.slug}
                      disabled={busy}
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next && next !== hub.slug) void saveSlug(next);
                      }}
                    />
                  </label>
                </div>
              ) : null}

              {workspaceTab === 'bundles' ? (
                <div className="mt-6">
                  <p className="text-sm text-muted">
                    Organise {copy.categoryLabelPlural.toLowerCase()} — add products on the Products tab.
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="flex-1 text-sm">
                      <span className="font-semibold">{copy.addCategory}</span>
                      <input
                        className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder={copy.categoryLabel}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void addCategory()}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand px-4 text-sm font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  {hub.categories.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">No {copy.categoryLabel.toLowerCase()} yet.</p>
                  ) : (
                    <ul className="mt-6 space-y-3">
                      {hub.categories.map((category) => (
                        <li
                          key={category.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold">{category.name}</p>
                            <p className="text-xs text-muted">
                              {category.items.length}{' '}
                              {category.items.length === 1 ? copy.itemLabel.toLowerCase() : copy.itemLabelPlural.toLowerCase()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setWorkspaceTab('primary')}
                              className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
                            >
                              Manage {copy.itemLabelPlural.toLowerCase()}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeCategory(category.id)}
                              className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-700"
                              aria-label={`Delete ${category.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {workspaceTab === 'import' && selected && hub ? (
                <CatalogBulkImport
                  locationId={selected.id}
                  priceVariantScope={hub.priceVariantScope}
                  categories={hub.categories}
                  itemLabelPlural={copy.itemLabelPlural}
                  onComplete={reload}
                  onError={setError}
                  onMessage={setMessage}
                />
              ) : null}

              {workspaceTab !== 'primary' &&
              workspaceTab !== 'bundles' &&
              workspaceTab !== 'qr' &&
              workspaceTab !== 'import' ? (
                <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper px-5 py-10 text-center">
                  <p className="font-semibold">{copy.tabs.find((t) => t.id === workspaceTab)?.label}</p>
                  <p className="mt-2 text-sm text-muted">This section is on the roadmap — your categories still work below.</p>
                </div>
              ) : null}

              {workspaceTab === 'primary' ? (
                <div className="mt-6 space-y-6">
                  <CatalogCategoryPills
                    categories={hub.categories}
                    activeId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                    addLabel={copy.addCategory}
                    newName={newCategory}
                    onNewNameChange={setNewCategory}
                    showAddField={showAddCategoryField}
                    onToggleAddField={() => setShowAddCategoryField((v) => !v)}
                    onAdd={() => {
                      void addCategory().then(() => {
                        setShowAddCategoryField(false);
                      });
                    }}
                  />

                  {hub.categories.length === 0 ? (
                    <p className="text-sm text-muted">No {copy.categoryLabel.toLowerCase()} yet.</p>
                  ) : activeCategory ? (
                    (() => {
                      const category = activeCategory;
                      const draft = itemDrafts[category.id] ?? emptyItemDraft();
                      const variants = category.priceVariants ?? [];
                      return (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-ink">{category.name}</h2>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`add-item-${category.id}`);
                                  el?.focus();
                                }}
                                className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
                              >
                                <Plus className="h-4 w-4" aria-hidden />
                                {copy.addItem}
                              </button>
                              <span className="text-xs text-muted">
                                {category.items.length}{' '}
                                {category.items.length === 1
                                  ? copy.itemLabel.toLowerCase()
                                  : copy.itemLabelPlural.toLowerCase()}
                              </span>
                              <button
                                type="button"
                                onClick={() => void removeCategory(category.id)}
                                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"
                                aria-label={`Delete ${category.name}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {categoryScoped ? (
                            <CategoryPriceVariantsEditor
                              variants={variants}
                              busy={busy}
                              onSave={(priceVariants) =>
                                void saveCategoryVariants(category.id, priceVariants)
                              }
                            />
                          ) : null}

                          <ul className="mt-4 space-y-3">
                            {category.items.map((item) => {
                              return (
                                <li key={item.id}>
                                  {editingItemId === item.id ? (
                                    <div className="space-y-2 rounded-2xl border border-line bg-white p-4">
                                      {selected ? (
                                        <MenuItemPhotoUpload
                                          locationId={selected.id}
                                          itemId={item.id}
                                          imageUrls={item.imageUrls}
                                          placeholder={imagePlaceholder}
                                          onUpdated={reload}
                                        />
                                      ) : null}
                                      <input
                                        className="w-full rounded-lg border border-line px-2 py-1.5"
                                        value={editDraft.name}
                                        onChange={(e) =>
                                          setEditDraft((d) => ({ ...d, name: e.target.value }))
                                        }
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        {categoryScoped ? (
                                          <MenuItemPriceInputs
                                            variants={variants}
                                            singlePrice={editDraft.price}
                                            variantPrices={editDraft.variantPrices}
                                            onSinglePriceChange={(value) =>
                                              setEditDraft((d) => ({ ...d, price: value }))
                                            }
                                            onVariantPriceChange={(variantId, value) =>
                                              setEditDraft((d) => ({
                                                ...d,
                                                variantPrices: {
                                                  ...d.variantPrices,
                                                  [variantId]: value,
                                                },
                                              }))
                                            }
                                          />
                                        ) : (
                                          <ItemPriceVariantsEditor
                                            options={editDraft.productOptions}
                                            singlePrice={editDraft.price}
                                            onOptionsChange={(productOptions) =>
                                              setEditDraft((d) => ({ ...d, productOptions }))
                                            }
                                            onSinglePriceChange={(value) =>
                                              setEditDraft((d) => ({ ...d, price: value }))
                                            }
                                          />
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => void saveEditItem(category)}
                                          className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingItemId(null)}
                                          className="rounded-lg border border-line px-3 py-1 text-xs font-semibold"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <CatalogItemCard
                                      name={item.name}
                                      description={item.description}
                                      priceLabel={formatMenuItemPrice(item)}
                                      imageUrls={item.imageUrls}
                                      imageUrl={item.imageUrl}
                                      imagePlaceholder={imagePlaceholder}
                                      showVegBadge={copy.showVegBadge}
                                      isNonVeg={item.isNonVeg}
                                      isAvailable={item.isAvailable}
                                      onToggleAvailable={(next) =>
                                        void toggleItemAvailable(item, next)
                                      }
                                      onEdit={() =>
                                        startEditItem(item, category, categoryScoped ?? false)
                                      }
                                      onRemove={() => void removeItem(item.id)}
                                    />
                                  )}
                                </li>
                              );
                            })}
                          </ul>

                          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-dashed border-line bg-paper/80 p-4">
                            <input
                              id={`add-item-${category.id}`}
                              placeholder={copy.itemLabel}
                              className="min-w-[8rem] flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                              value={draft.name}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({
                                  ...prev,
                                  [category.id]: { ...draft, name: e.target.value },
                                }))
                              }
                            />
                            {categoryScoped ? (
                              <MenuItemPriceInputs
                                variants={variants}
                                singlePrice={draft.price}
                                variantPrices={draft.variantPrices}
                                onSinglePriceChange={(value) =>
                                  setItemDrafts((prev) => ({
                                    ...prev,
                                    [category.id]: { ...draft, price: value },
                                  }))
                                }
                                onVariantPriceChange={(variantId, value) =>
                                  setItemDrafts((prev) => ({
                                    ...prev,
                                    [category.id]: {
                                      ...draft,
                                      variantPrices: { ...draft.variantPrices, [variantId]: value },
                                    },
                                  }))
                                }
                              />
                            ) : (
                              <ItemPriceVariantsEditor
                                options={draft.productOptions}
                                singlePrice={draft.price}
                                onOptionsChange={(productOptions) =>
                                  setItemDrafts((prev) => ({
                                    ...prev,
                                    [category.id]: { ...draft, productOptions },
                                  }))
                                }
                                onSinglePriceChange={(value) =>
                                  setItemDrafts((prev) => ({
                                    ...prev,
                                    [category.id]: { ...draft, price: value },
                                  }))
                                }
                              />
                            )}
                            {copy.showVegBadge ? (
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={draft.isNonVeg}
                                  onChange={(e) =>
                                    setItemDrafts((prev) => ({
                                      ...prev,
                                      [category.id]: { ...draft, isNonVeg: e.target.checked },
                                    }))
                                  }
                                />
                                Non-veg
                              </label>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void addItem(category.id)}
                              className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold"
                            >
                              {copy.addItem}
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <MenuGuestPreview
                locationName={selected.name}
                copy={copy}
                categories={hub.categories}
                imagePlaceholder={imagePlaceholder}
                locked={!unlocked}
                priceVariantScope={hub.priceVariantScope}
                activeCategoryId={selectedCategoryId}
                featuredTabLabel={featuredTabLabel}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, Lock, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { MenuItemImageCarousel, type MenuImagePlaceholder } from '../components/menu/MenuItemImageCarousel';
import { MenuGuestPreview } from '../components/menu/MenuGuestPreview';
import { MenuItemPhotoUpload } from '../components/quickcommerce/MenuItemPhotoUpload';
import { CatalogWorkspaceTabs } from '../components/quickcommerce/CatalogWorkspaceTabs';
import { CategoryPriceVariantsEditor } from '../components/quickcommerce/CategoryPriceVariantsEditor';
import { ItemPriceVariantsEditor } from '../components/quickcommerce/ItemPriceVariantsEditor';
import { MenuItemPriceInputs } from '../components/quickcommerce/MenuItemPriceInputs';
import { QuickCommerceOnboarding } from '../components/quickcommerce/QuickCommerceOnboarding';
import { api, ApiError } from '../lib/api';
import { useLocationContext } from '../lib/location-context';
import {
  formatMenuItemPrice,
  formatMenuItemPriceDetail,
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
  itemLabel: string;
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
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ItemDraft>(emptyItemDraft());
  const [workspaceTab, setWorkspaceTab] = useState('primary');
  const [changingCategory, setChangingCategory] = useState(false);

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

  async function copyLink() {
    if (!hub) return;
    try {
      await navigator.clipboard.writeText(hub.publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const unlocked = hub?.menuUnlocked ?? false;
  const copy = hub?.copy;
  const imagePlaceholder = hub?.imagePlaceholder ?? 'retail';
  const categoryScoped = hub?.priceVariantScope === 'category';

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

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <CatalogWorkspaceTabs
                tabs={copy.tabs}
                activeId={workspaceTab}
                onChange={setWorkspaceTab}
              />

              {workspaceTab === 'qr' ? (
                <div className="mt-6 rounded-2xl border border-line bg-white p-5">
                  <p className="text-sm font-semibold">Public link & QR</p>
                  <p className="mt-1 text-xs text-muted">Guests open this URL from your QR code.</p>
                  <p className="mt-3 break-all font-mono text-xs">{hub.publicUrl}</p>
                  <label className="mt-4 block text-sm">
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => void copyLink()}
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold disabled:opacity-50"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy link
                    </button>
                  </div>
                </div>
              ) : null}

              {workspaceTab === 'import' ? (
                <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper px-5 py-10 text-center">
                  <p className="font-semibold">Import bulk</p>
                  <p className="mt-2 text-sm text-muted">
                    CSV / Excel import with column mapping is coming in the next release.
                  </p>
                </div>
              ) : null}

              {workspaceTab !== 'primary' && workspaceTab !== 'qr' && workspaceTab !== 'import' ? (
                <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper px-5 py-10 text-center">
                  <p className="font-semibold">{copy.tabs.find((t) => t.id === workspaceTab)?.label}</p>
                  <p className="mt-2 text-sm text-muted">This section is on the roadmap — your categories still work below.</p>
                </div>
              ) : null}

              {workspaceTab === 'primary' ? (
              <>
              <div className="mt-6 flex flex-wrap items-end gap-2">
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
                <div className="mt-6 space-y-4">
              {hub.categories.map((category) => {
                const draft = itemDrafts[category.id] ?? emptyItemDraft();
                const variants = category.priceVariants ?? [];
                return (
                  <div key={category.id} className="rounded-2xl border border-line bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold">{category.name}</h2>
                      <button
                        type="button"
                        onClick={() => void removeCategory(category.id)}
                        className="rounded-lg p-1 text-muted hover:bg-red-50 hover:text-red-700"
                        aria-label="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {categoryScoped ? (
                      <CategoryPriceVariantsEditor
                        variants={variants}
                        busy={busy}
                        onSave={(priceVariants) => void saveCategoryVariants(category.id, priceVariants)}
                      />
                    ) : null}
                    <ul className="mt-3 space-y-2">
                      {category.items.map((item) => {
                        const itemVariants = itemPriceVariants(item, variants, categoryScoped ?? false);
                        return (
                        <li
                          key={item.id}
                          className="rounded-xl border border-line px-3 py-2 text-sm"
                        >
                          {editingItemId === item.id ? (
                            <div className="space-y-2">
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
                                        variantPrices: { ...d.variantPrices, [variantId]: value },
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
                            <div className="flex items-center gap-3">
                              <MenuItemImageCarousel
                                imageUrls={item.imageUrls}
                                imageUrl={item.imageUrl}
                                alt={item.name}
                                placeholder={imagePlaceholder}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold leading-snug">
                                  {copy.showVegBadge ? (
                                    <span
                                      className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-sm border ${
                                        item.isNonVeg
                                          ? 'border-red-700 bg-red-600'
                                          : 'border-green-700 bg-green-600'
                                      }`}
                                      title={item.isNonVeg ? 'Non-veg' : 'Veg'}
                                    />
                                  ) : null}
                                  {item.name}
                                </p>
                                <p className="text-muted" title={formatMenuItemPriceDetail(item, itemVariants)}>
                                  {formatMenuItemPrice(item)}
                                </p>
                                <label className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                                  <input
                                    type="checkbox"
                                    checked={item.isAvailable}
                                    onChange={(e) => void toggleItemAvailable(item, e.target.checked)}
                                  />
                                  On menu
                                </label>
                              </div>
                              <span className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditItem(item, category, categoryScoped ?? false)}
                                  className="rounded-lg border border-line px-2 py-1 text-xs font-semibold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void removeItem(item.id)}
                                  className="text-muted hover:text-red-700"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </span>
                            </div>
                          )}
                        </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <input
                        placeholder={copy.itemLabel}
                        className="min-w-[8rem] flex-1 rounded-xl border border-line px-3 py-2 text-sm"
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
                        className="rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                      >
                        {copy.addItem}
                      </button>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
              </>
              ) : null}
            </div>

            <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <MenuGuestPreview
                locationName={selected.name}
                copy={copy}
                categories={hub.categories}
                imagePlaceholder={imagePlaceholder}
                locked={!unlocked}
                priceVariantScope={hub.priceVariantScope}
              />
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Public link</p>
                <p className="mt-2 break-all font-mono text-xs">{hub.publicUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => void copyLink()}
                    className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold disabled:opacity-50"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                  <a
                    href={unlocked ? hub.publicPath : undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!unlocked) e.preventDefault();
                    }}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${
                      unlocked ? 'bg-brand text-white' : 'cursor-not-allowed bg-paper text-muted'
                    }`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

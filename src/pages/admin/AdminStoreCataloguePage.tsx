import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { Sheet } from '../../components/admin/ui/Sheet';
import { MarketplaceProductPhoto } from '../../components/marketplace/MarketplaceProductPhoto';
import { api, ApiError } from '../../lib/api';
import { formatINR } from '../../lib/admin-ui';

type Category = { id: string; name: string; sortOrder: number; isActive: boolean };
type Product = {
  id: string;
  name: string;
  description: string | null;
  dimensions: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  priceInr: number;
  sortOrder: number;
  isActive: boolean;
};

type ProductDraft = { name: string; priceInr: string; imageUrl: string };

const emptyProductDraft: ProductDraft = { name: '', priceInr: '349', imageUrl: '' };

function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    priceInr: String(product.priceInr),
    imageUrl: product.imageUrl ?? '',
  };
}

export function AdminStoreCataloguePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<{ mode: 'add' } | { mode: 'edit'; productId: string } | null>(null);
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProductDraft);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) ?? '—' : 'Uncategorized');
  }, [categories]);

  async function load() {
    const [categoryRows, catalog] = await Promise.all([
      api<Category[]>('/api/admin/marketplace/categories'),
      api<Product[]>('/api/admin/marketplace/products'),
    ]);
    setCategories(categoryRows);
    setProducts(catalog);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load catalogue'));
  }, []);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  function openAdd() {
    setProductDraft(emptyProductDraft);
    setSheet({ mode: 'add' });
  }

  function openEdit(product: Product) {
    setProductDraft(draftFromProduct(product));
    setSheet({ mode: 'edit', productId: product.id });
  }

  function closeSheet() {
    setSheet(null);
    setProductDraft(emptyProductDraft);
  }

  function bodyFromDraft() {
    const name = productDraft.name.trim();
    const imageUrl = productDraft.imageUrl.trim();
    return {
      name,
      priceInr: Number(productDraft.priceInr) || 0,
      imageUrl: imageUrl || null,
    };
  }

  async function saveProduct() {
    const body = bodyFromDraft();
    if (!body.name) return;
    if (sheet?.mode === 'add') {
      await run(() => api('/api/admin/marketplace/products', { method: 'POST', body }));
    } else if (sheet?.mode === 'edit') {
      await run(() => api(`/api/admin/marketplace/products/${sheet.productId}`, { method: 'PATCH', body }));
    }
    closeSheet();
  }

  const sheetTitle = sheet?.mode === 'edit' ? 'Edit product' : 'Add product';
  const saveLabel = sheet?.mode === 'edit' ? 'Save changes' : 'Create product';
  const previewProduct = {
    name: productDraft.name.trim() || 'Product',
    imageUrl: productDraft.imageUrl.trim() || null,
  };

  return (
    <div>
      <PageHeader
        title="Store catalogue"
        subtitle="Products merchants can order from the marketplace."
        actions={
          <button type="button" className="admin-btn-primary" onClick={openAdd}>
            Add product
          </button>
        }
      />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="admin-card overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--admin-border-soft)]">
              <MarketplaceProductPhoto product={product} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="font-semibold">{product.name}</p>
              <p className="admin-meta mt-1 text-sm">
                {formatINR(product.priceInr)} · {categoryName(product.categoryId)}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openEdit(product)}
                  className="admin-btn-secondary flex-1 text-sm"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() =>
                      api(`/api/admin/marketplace/products/${product.id}`, {
                        method: 'PATCH',
                        body: { isActive: !product.isActive },
                      }),
                    )
                  }
                  className="admin-btn-secondary flex-1 text-sm"
                >
                  {product.isActive ? 'Listed' : 'Hidden'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Sheet open={sheet !== null} title={sheetTitle} onClose={closeSheet}>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="admin-label">Name</span>
            <input
              className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              value={productDraft.name}
              onChange={(e) => setProductDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="admin-label">Price (₹)</span>
            <input
              className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              inputMode="numeric"
              value={productDraft.priceInr}
              onChange={(e) => setProductDraft((d) => ({ ...d, priceInr: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="admin-label">Image URL</span>
            <input
              className="admin-ctl admin-ctl-form mt-1 w-full px-3 text-sm"
              placeholder="/marketplace/… or https://…"
              value={productDraft.imageUrl}
              onChange={(e) => setProductDraft((d) => ({ ...d, imageUrl: e.target.value }))}
            />
          </label>
          <div className="overflow-hidden rounded-[var(--admin-radius-ctl)] bg-[var(--admin-border-soft)]">
            <MarketplaceProductPhoto product={previewProduct} className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            disabled={busy || !productDraft.name.trim()}
            onClick={() => void saveProduct()}
            className="admin-btn-primary"
          >
            {saveLabel}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

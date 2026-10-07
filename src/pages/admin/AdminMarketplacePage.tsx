import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../../lib/api';

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

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

type Order = {
  id: string;
  status: string;
  designName: string;
  quantity: number;
  amountInr: number;
  businessNameSnapshot: string;
  phoneNumber: string;
  locationName: string;
  productName: string | null;
  createdAt: string;
};

const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const emptyProductDraft = {
  name: '',
  description: '',
  dimensions: '',
  categoryId: '',
  imageUrl: '',
  priceInr: '349',
  sortOrder: '0',
};

export function AdminMarketplacePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [productDraft, setProductDraft] = useState(emptyProductDraft);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'all' | string>('all');

  const filteredProducts = useMemo(() => {
    if (catalogCategoryFilter === 'all') return products;
    if (catalogCategoryFilter === '__none') {
      return products.filter((product) => !product.categoryId);
    }
    return products.filter((product) => product.categoryId === catalogCategoryFilter);
  }, [catalogCategoryFilter, products]);

  async function load() {
    const [categoryRows, catalog, orderRows] = await Promise.all([
      api<Category[]>('/api/admin/marketplace/categories'),
      api<Product[]>('/api/admin/marketplace/products'),
      api<Order[]>('/api/admin/marketplace/orders'),
    ]);
    setCategories(categoryRows);
    setProducts(catalog);
    setOrders(orderRows);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load marketplace'));
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

  async function createCategory() {
    const name = categoryName.trim();
    if (!name) return;
    await run(() =>
      api('/api/admin/marketplace/categories', {
        method: 'POST',
        body: { name, sortOrder: categories.length + 1 },
      }),
    );
    setCategoryName('');
  }

  async function saveProduct(product: Product, patch: Record<string, unknown>) {
    await run(() =>
      api(`/api/admin/marketplace/products/${product.id}`, { method: 'PATCH', body: patch }),
    );
  }

  async function createProduct() {
    const name = productDraft.name.trim();
    if (!name) return;
    await run(() =>
      api('/api/admin/marketplace/products', {
        method: 'POST',
        body: {
          name,
          description: productDraft.description.trim() || undefined,
          dimensions: productDraft.dimensions.trim() || undefined,
          categoryId: productDraft.categoryId || undefined,
          imageUrl: productDraft.imageUrl.trim() || undefined,
          priceInr: Number(productDraft.priceInr) || 0,
          sortOrder: Number(productDraft.sortOrder) || 0,
        },
      }),
    );
    setProductDraft(emptyProductDraft);
  }

  async function setOrderStatus(orderId: string, status: string) {
    await run(() => api(`/api/admin/marketplace/orders/${orderId}`, { method: 'PATCH', body: { status } }));
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Marketplace</h1>
      <p className="mt-1 text-sm text-muted">Categories, catalog photos, and fulfillment queue.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className="min-h-10 flex-1 rounded-xl border border-line px-3 text-sm sm:max-w-xs"
            placeholder="New category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !categoryName.trim()}
            onClick={() => void createCategory()}
            className="min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add category
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center gap-2 border-b border-line pb-3 last:border-0">
              <input
                className="min-h-9 flex-1 rounded-lg border border-line px-2 text-sm sm:max-w-xs"
                defaultValue={category.name}
                disabled={busy}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name && name !== category.name) {
                    void run(() =>
                      api(`/api/admin/marketplace/categories/${category.id}`, {
                        method: 'PATCH',
                        body: { name },
                      }),
                    );
                  }
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    api(`/api/admin/marketplace/categories/${category.id}`, {
                      method: 'PATCH',
                      body: { isActive: !category.isActive },
                    }),
                  )
                }
                className="min-h-9 rounded-lg border border-line px-3 text-xs font-semibold"
              >
                {category.isActive ? 'Visible' : 'Hidden'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Add product</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold">Name</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={productDraft.name}
              onChange={(e) => setProductDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold">Description</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              rows={2}
              value={productDraft.description}
              onChange={(e) => setProductDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Dimensions</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={productDraft.dimensions}
              onChange={(e) => setProductDraft((d) => ({ ...d, dimensions: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Category</span>
            <select
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={productDraft.categoryId}
              onChange={(e) => setProductDraft((d) => ({ ...d, categoryId: e.target.value }))}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold">Photo URL</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              placeholder="https://…"
              value={productDraft.imageUrl}
              onChange={(e) => setProductDraft((d) => ({ ...d, imageUrl: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Price (₹)</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={productDraft.priceInr}
              onChange={(e) => setProductDraft((d) => ({ ...d, priceInr: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Sort order</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={productDraft.sortOrder}
              onChange={(e) => setProductDraft((d) => ({ ...d, sortOrder: e.target.value }))}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy || !productDraft.name.trim()}
          onClick={() => void createProduct()}
          className="mt-4 min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Create product
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Catalog</h2>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-muted">Filter</span>
            <select
              className="min-h-9 rounded-lg border border-line px-2"
              value={catalogCategoryFilter}
              onChange={(e) => setCatalogCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="__none">Uncategorized</option>
            </select>
          </label>
        </div>
        <ul className="mt-4 space-y-6">
          {filteredProducts.map((product) => (
            <li key={product.id} className="border-b border-line pb-6 last:border-0">
              <div className="flex flex-wrap gap-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-24 w-32 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-paper text-xs text-muted">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full rounded-lg border border-line px-2 py-1 font-semibold"
                    defaultValue={product.name}
                    disabled={busy}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== product.name) void saveProduct(product, { name });
                    }}
                  />
                  <textarea
                    className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-sm"
                    rows={2}
                    defaultValue={product.description ?? ''}
                    disabled={busy}
                    onBlur={(e) => {
                      const description = e.target.value.trim();
                      if (description !== (product.description ?? '')) {
                        void saveProduct(product, { description });
                      }
                    }}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      className="w-24 rounded-lg border border-line px-2 py-1 text-sm"
                      defaultValue={product.priceInr}
                      disabled={busy}
                      onBlur={(e) => {
                        const priceInr = Number(e.target.value);
                        if (!Number.isNaN(priceInr) && priceInr !== product.priceInr) {
                          void saveProduct(product, { priceInr });
                        }
                      }}
                    />
                    <select
                      className="rounded-lg border border-line px-2 py-1 text-sm"
                      value={product.categoryId ?? ''}
                      disabled={busy}
                      onChange={(e) =>
                        void saveProduct(product, {
                          categoryId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveProduct(product, { isActive: !product.isActive })}
                      className="min-h-9 rounded-lg border border-line px-3 text-xs font-semibold"
                    >
                      {product.isActive ? 'Listed' : 'Hidden'}
                    </button>
                  </div>
                  <input
                    className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-xs"
                    placeholder="Photo URL"
                    defaultValue={product.imageUrl ?? ''}
                    disabled={busy}
                    onBlur={(e) => {
                      const imageUrl = e.target.value.trim();
                      if (imageUrl !== (product.imageUrl ?? '')) {
                        void saveProduct(product, { imageUrl: imageUrl || null });
                      }
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {filteredProducts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No products in this category.</p>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No hardware orders yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-xl border border-line p-4">
                <p className="font-semibold">{order.businessNameSnapshot}</p>
                <p className="text-sm text-muted">
                  {order.designName} · {order.locationName} · ₹{order.amountInr} · {order.phoneNumber}
                </p>
                <p className="text-xs text-muted">
                  {order.status} · {new Date(order.createdAt).toLocaleString()}
                </p>
                <select
                  value={order.status}
                  disabled={busy}
                  onChange={(e) => void setOrderStatus(order.id, e.target.value)}
                  className="mt-3 min-h-10 rounded-xl border border-line px-3 text-sm"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

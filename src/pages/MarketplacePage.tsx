import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/ui/Segmented';
import { StatusPill } from '../components/ui/StatusPill';
import { MarketplaceProductPhoto } from '../components/marketplace/MarketplaceProductPhoto';
import { marketplaceDimensionBadge } from '../lib/marketplace-image';
import { useLocationContext } from '../lib/location-context';

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  dimensions: string | null;
  imageUrl: string | null;
  priceInr: number;
};

type Order = {
  id: string;
  status: string;
  designName: string;
  quantity: number;
  amountInr: number;
  phoneNumber: string;
  productName: string | null;
  pendingPaymentId: string | null;
  createdAt: string;
};

type Hub = {
  businessName: string;
  categories: Category[];
  products: Product[];
  orders: Order[];
};

const STATUS_LABEL: Record<string, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  IN_PRODUCTION: 'In production',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function catalogSections(hub: Hub): Array<{ category: Category; products: Product[] }> {
  const byCategory = new Map<string | null, Product[]>();
  for (const product of hub.products) {
    const bucket = byCategory.get(product.categoryId) ?? [];
    bucket.push(product);
    byCategory.set(product.categoryId, bucket);
  }

  const sections = hub.categories
    .map((category) => ({
      category,
      products: byCategory.get(category.id) ?? [],
    }))
    .filter((section) => section.products.length > 0);

  const uncategorized = byCategory.get(null) ?? [];
  if (uncategorized.length > 0) {
    sections.push({
      category: { id: '__other', name: 'Other' },
      products: uncategorized,
    });
  }

  return sections;
}

function ProductCard({
  product,
  onOrder,
}: {
  product: Product;
  onOrder: (product: Product) => void;
}) {
  const sizeBadge = marketplaceDimensionBadge(product.dimensions);
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-4 sm:p-5">
      <MarketplaceProductPhoto product={product} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="font-bold leading-snug">{product.name}</p>
        {sizeBadge ? (
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {sizeBadge}
          </span>
        ) : null}
      </div>
      {product.description ? (
        <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{product.description}</p>
      ) : (
        <div className="flex-1" />
      )}
      <p className="mt-3 text-2xl font-extrabold tracking-tight">₹{product.priceInr}</p>
      <button
        type="button"
        onClick={() => onOrder(product)}
        className="mt-4 w-full rounded-xl bg-brand px-3 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Order now
      </button>
    </div>
  );
}

export function MarketplacePage() {
  const { selected } = useLocationContext();
  const [hub, setHub] = useState<Hub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [designName, setDesignName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  const sections = useMemo(() => (hub ? catalogSections(hub) : []), [hub]);

  const filterOptions = useMemo(
    () => [
      { id: 'all' as const, name: 'All', count: hub?.products.length ?? 0 },
      ...sections.map((section) => ({
        id: section.category.id,
        name: section.category.name,
        count: section.products.length,
      })),
    ],
    [hub?.products.length, sections],
  );

  const visibleSections = useMemo(() => {
    if (categoryFilter === 'all') return sections;
    return sections.filter((section) => section.category.id === categoryFilter);
  }, [categoryFilter, sections]);

  useEffect(() => {
    if (!selected) {
      setHub(null);
      setCategoryFilter('all');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<Hub>(`/api/locations/${selected.id}/marketplace`);
        if (!cancelled) {
          setHub(data);
          setCategoryFilter('all');
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load marketplace');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function reload() {
    if (!selected) return;
    const data = await api<Hub>(`/api/locations/${selected.id}/marketplace`);
    setHub(data);
  }

  async function placeOrder(provider: 'UPI' | 'CASH') {
    if (!selected || !checkoutProduct) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ message: string }>(`/api/locations/${selected.id}/marketplace/orders`, {
        method: 'POST',
        body: {
          productId: checkoutProduct.id,
          phoneNumber: phone.trim(),
          quantity,
          designName: designName.trim() || undefined,
          provider,
        },
      });
      setMessage(result.message);
      setCheckoutProduct(null);
      setPhone('');
      setQuantity(1);
      setDesignName('');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Order failed');
    } finally {
      setBusy(false);
    }
  }

  function startCheckout(product: Product) {
    setCheckoutProduct(product);
    setDesignName(product.name);
  }

  const pendingOrder = hub?.orders.find((o) => o.pendingPaymentId || o.status === 'PLACED');

  return (
    <div>
      <PageHeader
        breadcrumb="This location / Marketplace"
        title="Marketplace"
        description={`Printed standees and NFC cards for ${selected ? selected.name : 'your location'}.`}
      />

      {!selected ? (
        <p className="mt-6 text-sm text-muted">Select a location to browse hardware and track orders.</p>
      ) : null}

      {message ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand-dark">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {selected && hub ? (
        <>
          {pendingOrder ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-amber-line bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>
                <span className="font-semibold">{pendingOrder.productName ?? pendingOrder.designName}</span>
                {' · '}Qty {pendingOrder.quantity} · ₹{pendingOrder.amountInr.toLocaleString('en-IN')}
              </p>
              <StatusPill variant="pending" label="Payment pending confirmation" />
            </div>
          ) : null}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[17px] font-bold text-ink">Catalog</h2>
              {filterOptions.length > 1 ? (
                <Segmented
                  aria-label="Product category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={filterOptions.map((o) => ({
                    id: o.id,
                    label: `${o.name} · ${o.count}`,
                  }))}
                />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted">
              QR codes link to your live review, commerce, or connect pages for {hub.businessName}.
            </p>
            {visibleSections.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No products listed yet.</p>
            ) : (
              visibleSections.map((section) => (
                <div key={section.category.id} className="mt-8 first:mt-4">
                  {categoryFilter === 'all' ? (
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{section.category.name}</h3>
                  ) : null}
                  <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${categoryFilter === 'all' ? 'mt-4' : 'mt-0'}`}>
                    {section.products.map((product) => (
                      <ProductCard key={product.id} product={product} onOrder={startCheckout} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          {checkoutProduct ? (
            <div className="mt-8 rounded-2xl border border-brand/30 bg-white p-5 shadow-sm">
              <p className="font-bold">Checkout — {checkoutProduct.name}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-semibold">Contact phone</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91…"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold">Quantity</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="font-semibold">Name on print (optional)</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                  />
                </label>
              </div>
              <p className="mt-3 text-sm text-muted">
                Total ₹{checkoutProduct.priceInr * quantity} — pay via UPI or cash; admin confirms before
                production.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !phone.trim()}
                  onClick={() => void placeOrder('UPI')}
                  className="min-h-10 flex-1 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50 sm:flex-none"
                >
                  Pay via UPI
                </button>
                <button
                  type="button"
                  disabled={busy || !phone.trim()}
                  onClick={() => void placeOrder('CASH')}
                  className="min-h-10 flex-1 rounded-xl border border-line px-4 text-sm font-semibold disabled:opacity-50 sm:flex-none"
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutProduct(null)}
                  className="min-h-10 rounded-xl px-4 text-sm font-semibold text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <section className="mt-10">
            <h2 className="font-bold">Your orders</h2>
            {hub.orders.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No hardware orders yet for this location.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {hub.orders.map((order) => (
                  <li key={order.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{order.designName}</p>
                        <p className="text-sm text-muted">
                          {order.productName ?? 'Product'} · qty {order.quantity} · ₹{order.amountInr}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(order.createdAt).toLocaleString()} · {order.phoneNumber}
                        </p>
                      </div>
                      <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    {order.pendingPaymentId && order.status === 'PLACED' ? (
                      <p className="mt-2 text-xs text-amber-900">Payment pending admin confirmation</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

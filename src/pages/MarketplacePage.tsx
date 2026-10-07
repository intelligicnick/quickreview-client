import { useEffect, useMemo, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { api, ApiError } from '../lib/api';
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
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-5">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-paper text-xs font-semibold text-muted">
          Photo coming soon
        </div>
      )}
      <p className="mt-4 font-bold">{product.name}</p>
      {product.dimensions ? <p className="text-xs text-muted">{product.dimensions}</p> : null}
      <p className="mt-2 flex-1 text-sm text-muted">{product.description}</p>
      <p className="mt-3 text-xl font-extrabold">₹{product.priceInr}</p>
      <button
        type="button"
        onClick={() => onOrder(product)}
        className="mt-4 w-full rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Order
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

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <ShoppingBag className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Marketplace</h1>
          <p className="text-sm text-muted">
            Physical QR standees and cards — fulfilled by QuickReview for{' '}
            {selected ? selected.name : 'your location'}.
          </p>
        </div>
      </div>

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
          <section className="mt-8">
            <h2 className="font-bold">Catalog</h2>
            <p className="mt-1 text-sm text-muted">
              QR codes link to your live review, commerce, or connect pages for {hub.businessName}.
            </p>
            {filterOptions.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                {filterOptions.map((option) => {
                  const active = categoryFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCategoryFilter(option.id)}
                      className={`min-h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-line bg-white text-ink hover:border-brand/40'
                      }`}
                    >
                      {option.name}
                      <span className={active ? 'text-white/80' : 'text-muted'}> ({option.count})</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
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

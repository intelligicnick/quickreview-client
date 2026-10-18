import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/admin/PageHeader';
import { api, ApiError } from '../../lib/api';
import { formatDateTime, formatINR } from '../../lib/admin-ui';

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

export function AdminHardwareOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setOrders(await api<Order[]>('/api/admin/marketplace/orders'));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load orders'));
  }, []);

  async function setOrderStatus(orderId: string, status: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/marketplace/orders/${orderId}`, { method: 'PATCH', body: { status } });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Hardware orders"
        subtitle="Fulfil standees and NFC — assign a QR code from stock when shipping."
      />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      <section className="admin-card admin-table-scroll p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase text-[var(--admin-muted)]">
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Item</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Phone</th>
              <th className="py-2 pr-3">Order status</th>
              <th className="py-2">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--admin-border-soft)]">
                <td className="py-3 pr-3 font-semibold">{order.businessNameSnapshot}</td>
                <td className="py-3 pr-3">{order.locationName}</td>
                <td className="py-3 pr-3">{order.productName ?? order.designName}</td>
                <td className="py-3 pr-3">{formatINR(order.amountInr)}</td>
                <td className="py-3 pr-3">{order.phoneNumber}</td>
                <td className="py-3 pr-3">
                  <select
                    value={order.status}
                    disabled={busy}
                    onChange={(e) => void setOrderStatus(order.id, e.target.value)}
                    className="admin-ctl px-2 text-xs"
                    aria-label={`Status for ${order.businessNameSnapshot}`}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {order.status === 'IN_PRODUCTION' ? (
                    <Link to="/admin/qr" className="mt-1 block text-xs font-semibold text-[var(--admin-brand)]">
                      Assign QR
                    </Link>
                  ) : null}
                </td>
                <td className="py-3 text-[var(--admin-muted)]">{formatDateTime(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <p className="admin-meta mt-4 text-sm">No hardware orders yet.</p> : null}
      </section>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ContactActions } from '../../components/crm/ContactActions';
import { formatInr } from '../../lib/crm/format';
import { quotationTotal } from '../../lib/crm/store';
import { useCrm } from '../../lib/crm/context';
import { crmPath } from '../../lib/crm/paths';
import type { QuotationLine } from '../../lib/crm/types';

export function CrmQuotationFormPage() {
  const { state, createQuotation, customerById } = useCrm();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState(params.get('customer') ?? '');
  const [catalogId, setCatalogId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [createdTotal, setCreatedTotal] = useState<number | null>(null);

  const item = state.catalog.find((c) => c.id === catalogId);
  const lines: QuotationLine[] = useMemo(() => {
    if (!item) return [];
    return [
      {
        catalogItemId: item.id,
        name: item.name,
        quantity: Number(quantity) || 1,
        unitPrice: item.price,
        taxPercent: item.taxPercent,
      },
    ];
  }, [item, quantity]);

  const total = quotationTotal(lines, Number(discount) || 0);
  const customer = customerId ? customerById(customerId) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !item) return;
    createQuotation({ customerId, lines, discount: Number(discount) || 0 });
    setCreatedTotal(total);
  }

  if (createdTotal != null && customer) {
    const msg = `Hi ${customer.name}, here is your quotation for ${item?.name ?? 'our services'} — total ${formatInr(createdTotal)}. Please let us know if you have any questions.`;
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="font-display text-2xl font-bold">Quotation ready</h1>
        <p className="text-sm text-muted">Total {formatInr(createdTotal)} · linked to customer & deal</p>
        <ContactActions mobile={customer.mobile} whatsAppMessage={msg} />
        <button type="button" className="btn-gradient w-full" onClick={() => navigate(crmPath('quotations'))}>
          View quotations
        </button>
        <p className="text-center text-xs text-muted">PDF & email — coming soon</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/quickcrm/customers" className="text-sm font-semibold text-brand">← Back</Link>
      <h1 className="font-display text-2xl font-bold">Create quotation</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Customer
          <select className="field mt-2" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select</option>
            {state.customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Product / service
          <select className="field mt-2" value={catalogId} onChange={(e) => setCatalogId(e.target.value)} required>
            <option value="">Select from Quick Commerce</option>
            {state.catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.commerceCategory ? `[${c.commerceCategory}] ` : ''}{c.name} — {formatInr(c.price)}
              </option>
            ))}
          </select>
        </label>
        {state.catalog.length === 0 ? (
          <p className="text-sm text-muted">Sync Quick Commerce above, or add items in Quick Commerce → Edit catalog.</p>
        ) : null}
        <label className="block text-sm font-semibold">
          Quantity
          <input className="field mt-2" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Discount (₹)
          <input className="field mt-2" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </label>
        <p className="rounded-xl bg-brand/5 px-4 py-3 font-display text-xl font-bold text-brand-dark">
          Total {formatInr(total)}
        </p>
        <button type="submit" className="btn-gradient w-full" disabled={!item}>Generate quote</button>
      </form>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatInr, pendingAmount } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';

export function CrmPaymentFormPage() {
  const { state, recordPayment } = useCrm();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetSale = params.get('sale');
  const presetCustomer = params.get('customer');

  const sales = useMemo(() => {
    if (presetSale) return state.sales.filter((s) => s.id === presetSale);
    if (presetCustomer) return state.sales.filter((s) => s.customerId === presetCustomer);
    return state.sales.filter((s) => pendingAmount(s) > 0);
  }, [state.sales, presetSale, presetCustomer]);

  const [saleId, setSaleId] = useState(presetSale ?? sales[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const sale = state.sales.find((s) => s.id === saleId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!saleId || !amount) return;
    recordPayment({ saleId, amount: Number(amount), note: note.trim() || undefined });
    navigate('/app/quickcrm/sales', { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/quickcrm/sales" className="text-sm font-semibold text-brand">← Sales</Link>
      <h1 className="font-display text-2xl font-bold">Record payment</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Sale
          <select className="field mt-2" value={saleId} onChange={(e) => setSaleId(e.target.value)} required>
            {sales.map((s) => {
              const c = state.customers.find((x) => x.id === s.customerId);
              return (
                <option key={s.id} value={s.id}>
                  {c?.name} — {s.title} ({formatInr(pendingAmount(s))} pending)
                </option>
              );
            })}
          </select>
        </label>
        {sale ? (
          <p className="rounded-xl bg-paper px-4 py-3 text-sm">
            Total {formatInr(sale.amount)} · Received {formatInr(sale.received)} · Pending{' '}
            {formatInr(pendingAmount(sale))}
          </p>
        ) : null}
        <label className="block text-sm font-semibold">
          Amount received (₹)
          <input className="field mt-2" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className="block text-sm font-semibold">
          Note
          <input className="field mt-2" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className="btn-gradient w-full">Save payment</button>
      </form>
    </div>
  );
}

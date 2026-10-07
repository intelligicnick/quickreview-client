import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';
import type { DealStage } from '../../lib/crm/types';

export function CrmSaleFormPage() {
  const { state, createSale } = useCrm();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState(params.get('customer') ?? '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<DealStage>('interested');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !title.trim() || !amount) return;
    createSale({
      customerId,
      title: title.trim(),
      amount: Number(amount),
      stage,
    });
    navigate('/app/quickcrm/sales', { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/quickcrm/sales" className="text-sm font-semibold text-brand">← Sales</Link>
      <h1 className="font-display text-2xl font-bold">Add sale</h1>
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
          <input className="field mt-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block text-sm font-semibold">
          Amount (₹)
          <input className="field mt-2" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className="block text-sm font-semibold">
          Stage
          <select className="field mt-2" value={stage} onChange={(e) => setStage(e.target.value as DealStage)}>
            <option value="new">New</option>
            <option value="interested">Interested</option>
            <option value="quotation">Quotation</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
          </select>
        </label>
        <button type="submit" className="btn-gradient w-full">Save sale</button>
      </form>
    </div>
  );
}

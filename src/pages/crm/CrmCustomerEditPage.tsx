import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';
import type { DealStage } from '../../lib/crm/types';
import { DEAL_STAGE_LABELS } from '../../lib/crm/terminology';

export function CrmCustomerEditPage() {
  const { customerId } = useParams();
  const { customerById, updateCustomer } = useCrm();
  const navigate = useNavigate();
  const customer = customerId ? customerById(customerId) : undefined;

  const [name, setName] = useState(customer?.name ?? '');
  const [mobile, setMobile] = useState(customer?.mobile ?? '');
  const [company, setCompany] = useState(customer?.company ?? '');
  const [status, setStatus] = useState<DealStage>(customer?.status ?? 'new');

  if (!customer) return <p className="text-muted">Not found</p>;

  const id = customer.id;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateCustomer(id, {
      name: name.trim(),
      mobile: mobile.trim(),
      company: company.trim() || undefined,
      status,
    });
    navigate(`/app/quickcrm/customers/${id}`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to={`/app/quickcrm/customers/${customer.id}`} className="text-sm font-semibold text-brand">← Profile</Link>
      <h1 className="font-display text-2xl font-bold">Edit customer</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} />
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value as DealStage)}>
          {Object.entries(DEAL_STAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="btn-gradient w-full">Save</button>
      </form>
    </div>
  );
}

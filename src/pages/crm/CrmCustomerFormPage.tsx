import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';

export function CrmCustomerFormPage() {
  const { addCustomer } = useCrm();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [notes, setNotes] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;
    const customer = addCustomer({
      name: name.trim(),
      mobile: mobile.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      customerType: customerType.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    navigate(`/app/quickcrm/customers/${customer.id}`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/app/quickcrm/customers" className="text-sm font-semibold text-brand">← Customers</Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Add customer</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">Name *<input className="field mt-2" required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Mobile *<input className="field mt-2" required inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Company<input className="field mt-2" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Email<input className="field mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Customer type<input className="field mt-2" value={customerType} onChange={(e) => setCustomerType(e.target.value)} placeholder="Retail / Wholesale" /></label>
        <label className="block text-sm font-semibold">Notes<textarea className="field mt-2 min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <button type="submit" className="btn-gradient w-full">Save customer</button>
      </form>
    </div>
  );
}

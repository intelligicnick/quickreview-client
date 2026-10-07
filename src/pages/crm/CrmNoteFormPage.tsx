import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';

export function CrmNoteFormPage() {
  const { state, addNote } = useCrm();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [text, setText] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !text.trim()) return;
    addNote(customerId, text.trim());
    navigate(`/app/quickcrm/customers/${customerId}`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">Add note</h1>
      <form onSubmit={submit} className="space-y-4">
        <select className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
          <option value="">Customer</option>
          {state.customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <textarea className="field min-h-32" value={text} onChange={(e) => setText(e.target.value)} required />
        <button type="submit" className="btn-gradient w-full">Save note</button>
        <Link to="/app" className="block text-center text-sm text-muted">Cancel</Link>
      </form>
    </div>
  );
}

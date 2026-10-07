import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';

export function CrmFollowUpFormPage() {
  const { state, addFollowUp, rescheduleFollowUp } = useCrm();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetCustomer = params.get('customer') ?? '';
  const rescheduleId = params.get('reschedule');

  const [customerId, setCustomerId] = useState(presetCustomer);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('11:00');
  const [reason, setReason] = useState('Quotation');

  const customers = useMemo(() => state.customers, [state.customers]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    const dueAt = new Date(`${date}T${time}:00`).toISOString();
    if (rescheduleId) {
      rescheduleFollowUp(rescheduleId, dueAt);
    } else {
      addFollowUp({ customerId, dueAt, reason });
    }
    navigate('/app/quickcrm/follow-ups', { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/quickcrm/follow-ups" className="text-sm font-semibold text-brand">← Follow-ups</Link>
      <h1 className="font-display text-2xl font-bold">{rescheduleId ? 'Reschedule' : 'New follow-up'}</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Follow up with
          <select className="field mt-2" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            When
            <input type="date" className="field mt-2" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Time
            <input type="time" className="field mt-2" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Reason
          <input className="field mt-2" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button type="submit" className="btn-gradient w-full">Save follow-up</button>
      </form>
    </div>
  );
}

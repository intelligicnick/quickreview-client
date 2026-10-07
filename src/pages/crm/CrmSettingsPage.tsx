import { Link } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';

export function CrmSettingsPage() {
  const { state } = useCrm();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/quickcrm/more" className="text-sm font-semibold text-brand">← More</Link>
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <div className="rounded-2xl border border-line bg-white p-4 text-sm">
        <p className="font-semibold">Currency</p>
        <p className="text-muted">INR (₹)</p>
        <p className="mt-4 font-semibold">Notifications</p>
        <p className="text-muted">Follow-up reminders — coming soon</p>
        <p className="mt-4 font-semibold">Data</p>
        <p className="text-muted">Stored securely on this device for workspace {state.profile?.businessName}</p>
      </div>
    </div>
  );
}

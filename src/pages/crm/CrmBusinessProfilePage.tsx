import { Link } from 'react-router-dom';
import { BUSINESS_TYPE_LABELS } from '../../lib/crm/terminology';
import { useCrm } from '../../lib/crm/context';

export function CrmBusinessProfilePage() {
  const { state } = useCrm();
  const p = state.profile;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/app/quickcrm/more" className="text-sm font-semibold text-brand">← More</Link>
      <h1 className="font-display text-2xl font-bold">Business profile</h1>
      {p ? (
        <dl className="divide-y divide-line rounded-2xl border border-line bg-white">
          {[
            ['Business', p.businessName],
            ['Type', BUSINESS_TYPE_LABELS[p.businessType]],
            ['Owner', p.ownerName],
            ['Mobile', p.mobile],
            ['Focus', p.goals.join(', ')],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="font-semibold text-right">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

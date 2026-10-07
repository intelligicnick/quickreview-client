import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/crm/EmptyState';

export function CrmTeamPage() {
  return (
    <div className="space-y-6">
      <Link to="/app/quickcrm/more" className="text-sm font-semibold text-brand">← More</Link>
      <EmptyState
        title="Team"
        description="Invite team members to share customers and follow-ups. Coming in a future update."
      />
    </div>
  );
}

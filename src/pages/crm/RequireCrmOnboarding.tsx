import { Navigate, Outlet } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';

export function RequireCrmOnboarding() {
  const { state, ready } = useCrm();
  if (!ready) {
    return <div className="py-20 text-center text-sm text-muted">Loading…</div>;
  }
  if (!state.profile?.onboardedAt) {
    return <Navigate to="/app/quickcrm/onboarding" replace />;
  }
  return <Outlet />;
}

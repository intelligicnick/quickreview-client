import { ChevronRight, Package, FileText, BarChart3, Users, Settings, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogLabel, salesLabel } from '../../lib/crm/terminology';
import { useCrm } from '../../lib/crm/context';

const LINKS = [
  { to: '/app/quickcrm/products', labelKey: 'catalog' as const, icon: Package, desc: 'Prices & units' },
  { to: '/app/quickcrm/follow-ups', label: 'Follow-ups', icon: FileText, desc: 'Calls & reminders' },
  { to: '/app/quickcrm/sales', label: 'Sales pipeline', icon: FileText, desc: 'Deal stages' },
  { to: '/app/quickcrm/reports', label: 'Reports', icon: BarChart3, desc: 'Simple numbers' },
  { to: '/app/quickcrm/team', label: 'Team', icon: Users, desc: 'Coming soon' },
  { to: '/app/quickcrm/settings', label: 'Settings', icon: Settings, desc: 'Preferences' },
  { to: '/app/quickcrm/business', label: 'Business profile', icon: Building2, desc: 'Your business' },
];

export function CrmMorePage() {
  const { state } = useCrm();
  const bt = state.profile?.businessType;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">More</h1>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {LINKS.map((item) => {
          const label =
            item.labelKey === 'catalog' ? catalogLabel(bt) : item.label ?? '';
          return (
            <li key={item.to}>
              <Link to={item.to} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-paper">
                <item.icon className="h-5 w-5 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-xs text-muted">
        {salesLabel(bt)} · Customers · Follow-ups — one simple CRM
      </p>
    </div>
  );
}

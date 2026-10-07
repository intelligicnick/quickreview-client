import { FileText, Home, MoreHorizontal, Receipt, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { CRM_BASE, crmPath } from '../../lib/crm/paths';

const ITEMS = [
  { to: CRM_BASE, label: 'Home', icon: Home, end: true },
  { to: crmPath('customers'), label: 'Customers', icon: Users, end: false },
  { to: crmPath('quotations'), label: 'Quotes', icon: FileText, end: false },
  { to: crmPath('invoices'), label: 'Invoices', icon: Receipt, end: false },
  { to: crmPath('more'), label: 'More', icon: MoreHorizontal, end: false },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur touch-manipulation pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Quick CRM"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold leading-tight ${
                  isActive ? 'text-brand' : 'text-muted'
                }`
              }
            >
              <item.icon className="h-5 w-5" strokeWidth={2} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

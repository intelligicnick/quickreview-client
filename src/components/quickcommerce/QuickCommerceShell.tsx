import { Repeat, ShoppingBag } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/app/quickcommerce', label: 'Catalogue', icon: ShoppingBag, end: true },
  { to: '/app/quickcommerce/revisit', label: 'Quick Revisit', icon: Repeat, end: true },
] as const;

export function QuickCommerceShell() {
  return (
    <div>
      <nav
        className="mb-6 flex flex-wrap gap-1 border-b border-line pb-1"
        aria-label="Quick Commerce sections"
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `inline-flex min-h-10 items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-semibold ${
                isActive ? 'bg-brand/10 text-brand-dark' : 'text-muted hover:text-ink'
              }`
            }
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

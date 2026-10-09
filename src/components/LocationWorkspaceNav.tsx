import { CreditCard, IdCard, QrCode, Star, UtensilsCrossed } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/app/quickreview', label: 'Reviews', icon: Star },
  { to: '/app/quickcommerce', label: 'QuickCommerce', icon: UtensilsCrossed },
  { to: '/app/quickconnect', label: 'Connect', icon: IdCard },
  { to: '/app/qr', label: 'QR & standees', icon: QrCode },
  { to: '/app/subscription', label: 'Plans & billing', icon: CreditCard },
] as const;

const WORKSPACE_PREFIXES = [
  '/app/quickreview',
  '/app/quickcommerce',
  '/app/quickmenu',
  '/app/quickconnect',
  '/app/qr',
  '/app/marketplace',
  '/app/subscription',
];

export function isWorkspaceRoute(pathname: string) {
  return WORKSPACE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function LocationWorkspaceNav() {
  return (
    <nav
      className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-line px-4 pb-px sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8"
      aria-label="Location workspace"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-brand text-brand-dark'
                : 'border-transparent text-muted hover:border-line hover:text-ink'
            }`
          }
        >
          <tab.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { crmPath } from '../../lib/crm/paths';
import { CommerceSyncBanner } from './CommerceSyncBanner';

const TABS = [
  { segment: '', label: 'Overview' },
  { segment: 'customers', label: 'Customers' },
  { segment: 'quotations', label: 'Quotations' },
  { segment: 'invoices', label: 'Invoices' },
  { segment: 'follow-ups', label: 'Follow-ups' },
] as const;

function needsCatalogSync(pathname: string) {
  const base = crmPath();
  return (
    pathname === base ||
    pathname === `${base}/` ||
    pathname.startsWith(crmPath('quotations')) ||
    pathname.startsWith(crmPath('products'))
  );
}

export function CrmChrome() {
  const location = useLocation();
  const hideChrome =
    location.pathname.includes('/onboarding') ||
    location.pathname.includes('/new') ||
    location.pathname.includes('/edit') ||
    location.pathname.endsWith('/search') ||
    /\/customers\/[^/]+$/.test(location.pathname);

  if (hideChrome) return null;

  const showSync = needsCatalogSync(location.pathname);

  return (
    <div className="mb-4 space-y-3 lg:mb-5">
      <div className="hidden lg:block">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">QuickCRM</p>
        <h1 className="font-display text-xl font-bold">Customers · quotes · invoices</h1>
      </div>
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="CRM sections">
        {TABS.map((tab) => {
          const to = tab.segment ? crmPath(tab.segment) : crmPath();
          const active =
            tab.segment === ''
              ? location.pathname === crmPath() || location.pathname === `${crmPath()}/`
              : location.pathname.startsWith(crmPath(tab.segment));
          return (
            <Link
              key={tab.segment || 'home'}
              to={to}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                active ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <Link
          to={crmPath('quotations/new')}
          className="ml-auto hidden shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white lg:inline-flex"
        >
          + Quotation
        </Link>
      </nav>
      {showSync ? <CommerceSyncBanner /> : null}
    </div>
  );
}

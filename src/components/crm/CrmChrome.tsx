import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { useCrm } from '../../lib/crm/context';
import { useLocationContext } from '../../lib/location-context';
import { crmPath } from '../../lib/crm/paths';
import { CommerceSyncBanner } from './CommerceSyncBanner';

const TAB_SEGMENTS = [
  { id: 'overview', segment: '' },
  { id: 'customers', segment: 'customers' },
  { id: 'quotations', segment: 'quotations' },
  { id: 'invoices', segment: 'invoices' },
  { id: 'follow-ups', segment: 'follow-ups' },
] as const;

const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  customers: 'Customers',
  quotations: 'Quotations',
  invoices: 'Invoices',
  'follow-ups': 'Follow-ups',
};

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
  const navigate = useNavigate();
  const { state } = useCrm();
  const { selected } = useLocationContext();
  const hideChrome =
    location.pathname.includes('/onboarding') ||
    location.pathname.includes('/new') ||
    location.pathname.includes('/edit') ||
    location.pathname.endsWith('/search') ||
    /\/customers\/[^/]+$/.test(location.pathname);

  if (hideChrome) return null;

  const quotes = state.quotations.filter((q) => q.documentType === 'quotation');
  const invoices = state.quotations.filter((q) => q.documentType === 'invoice');
  const openQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'draft');
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const openFollowUps = state.followUps.filter((f) => !f.completedAt).length;

  const counts: Record<string, number | undefined> = {
    customers: state.customers.length,
    quotations: openQuotes.length,
    invoices: unpaidInvoices.length,
    'follow-ups': openFollowUps,
  };

  const activeTab =
    TAB_SEGMENTS.find((t) =>
      t.segment === ''
        ? location.pathname === crmPath() || location.pathname === `${crmPath()}/`
        : location.pathname.startsWith(crmPath(t.segment)),
    )?.id ?? 'overview';

  const tabItems = TAB_SEGMENTS.map((tab) => {
    const count = counts[tab.id];
    const base = TAB_LABELS[tab.id] ?? tab.id;
    return { id: tab.id, label: count != null && tab.id !== 'overview' ? `${base} · ${count}` : base };
  });

  const showSync = needsCatalogSync(location.pathname);

  return (
    <div className="mb-6 space-y-4">
      <PageHeader
        breadcrumb="Sell & follow up / CRM"
        title="CRM"
        description={
          selected
            ? `Customers, quotations, invoices and follow-ups for ${selected.name}.`
            : 'Customers, quotations, invoices and follow-ups for this location.'
        }
        actions={
          <>
            <Button variant="secondary" size="sm" type="button" onClick={() => navigate(crmPath('customers/new'))}>
              + Customer
            </Button>
            <Button size="sm" type="button" onClick={() => navigate(crmPath('quotations/new'))}>
              + Quotation
            </Button>
          </>
        }
      />
      <Tabs
        aria-label="CRM sections"
        value={activeTab}
        onChange={(id) => {
          const row = TAB_SEGMENTS.find((t) => t.id === id);
          navigate(row?.segment ? crmPath(row.segment) : crmPath());
        }}
        items={tabItems}
      />
      {showSync ? <CommerceSyncBanner /> : null}
    </div>
  );
}

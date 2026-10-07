import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { CrmProvider } from '../../lib/crm/context';
import { crmPath } from '../../lib/crm/paths';
import { CrmSubscriptionGate } from './CrmSubscriptionGate';
import { BottomNav } from './BottomNav';
import { CrmChrome } from './CrmChrome';
import { QuickAddFab, QuickAddSheet } from './QuickAddSheet';

function CrmLayoutInner() {
  const location = useLocation();
  const [quickAdd, setQuickAdd] = useState(false);
  const onOnboarding = location.pathname.includes('/onboarding');
  const onSearch = location.pathname.endsWith('/search');

  useEffect(() => {
    setQuickAdd(false);
  }, [location.pathname]);

  return (
    <div className="crm-shell mx-auto max-w-5xl overflow-x-hidden pb-[calc(9rem+env(safe-area-inset-bottom))] lg:max-w-none lg:pb-0">
      {!onOnboarding && !onSearch ? (
        <Link
          to={crmPath('search')}
          className="mb-4 flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm text-muted active:bg-paper lg:max-w-md"
        >
          <Search className="h-4 w-4 shrink-0" />
          Search customers, sales, quotes…
        </Link>
      ) : null}
      {!onOnboarding ? <CrmChrome /> : null}
      <Outlet />
      {!onOnboarding ? (
        <>
          {!onSearch ? <QuickAddFab onOpen={() => setQuickAdd(true)} /> : null}
          <QuickAddSheet open={quickAdd} onClose={() => setQuickAdd(false)} />
          <BottomNav />
        </>
      ) : null}
    </div>
  );
}

export function CrmLayout() {
  return (
    <CrmProvider>
      <CrmSubscriptionGate>
        <CrmLayoutInner />
      </CrmSubscriptionGate>
    </CrmProvider>
  );
}

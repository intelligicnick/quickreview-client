import {
  CreditCard,
  LayoutDashboard,
  Menu,
  QrCode,
  Settings,
  ShoppingBag,
  Star,
  IdCard,
  Palette,
  ScanLine,
  Users,
  X,
  Search,
  Bell,
} from 'lucide-react';
import { CRM_BASE } from '../lib/crm/paths';
import { useEffect, useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { BrandMark } from './BrandMark';
import { ImpersonationBanner } from './ImpersonationBanner';
import { LocationSwitcher } from './LocationSwitcher';
import { AppAccountMenu } from './AppAccountMenu';
import { IconButton } from './ui/IconButton';
import { useLocationContext } from '../lib/location-context';
import { useLocationBillingSummary } from '../hooks/useLocationBillingSummary';

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  matchPrefix?: string;
  badge?: string;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Home',
    items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Get customers',
    items: [
      { to: '/app/quickreview', label: 'QuickReview', icon: Star, matchPrefix: '/app/quickreview' },
      { to: '/app/quickconnect', label: 'QuickConnect', icon: IdCard },
      { to: '/app/quickdesign', label: 'QuickDesign', icon: Palette },
    ],
  },
  {
    title: 'Sell & follow up',
    items: [
      { to: '/app/quickcommerce', label: 'QuickCommerce', icon: ShoppingBag, matchPrefix: '/app/quickcommerce' },
      { to: CRM_BASE, label: 'CRM', icon: Users, matchPrefix: CRM_BASE },
      { to: '/app/quickscan', label: 'QuickScan', icon: ScanLine },
    ],
  },
  {
    title: 'This location',
    items: [
      { to: '/app/qr', label: 'QR codes & standees', icon: QrCode },
      { to: '/app/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { to: '/app/subscription', label: 'Plans & billing', icon: CreditCard },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function navActive(pathname: string, item: NavItem, isActive: boolean) {
  return (
    isActive ||
    (item.matchPrefix != null && pathname.startsWith(item.matchPrefix)) ||
    (item.to === '/app/quickcommerce' && pathname.startsWith('/app/quickmenu'))
  );
}

export function AppShell() {
  const location = useLocation();
  const { selected } = useLocationContext();
  const { expiredCount, expiredLabel } = useLocationBillingSummary(selected?.id ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!selected?.id) {
      setInboxUnread(0);
      return;
    }
    let cancelled = false;
    void api<unknown[]>(`/api/locations/${selected.id}/inbox`)
      .then((rows) => {
        if (!cancelled) setInboxUnread(rows.length);
      })
      .catch(() => {
        if (!cancelled) setInboxUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    function onChange() {
      if (media.matches) setMenuOpen(false);
    }
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.to === '/app/quickreview' && inboxUnread > 0
        ? { ...item, badge: `${inboxUnread} new` }
        : item,
    ),
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-ground lg:flex-row">
      <header className="sticky top-0 z-30 w-full shrink-0 border-b border-line bg-white lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <BrandMark />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-ink hover:bg-line-soft"
          >
            <Menu className="h-[18px] w-[18px] stroke-[1.8]" />
          </button>
        </div>
        <div className="border-t border-line px-4 py-2">
          <LocationSwitcher variant="compact" />
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={
          menuOpen
            ? 'fixed inset-y-0 left-0 z-50 flex w-[min(248px,88vw)] flex-col border-r border-line bg-white shadow-xl'
            : 'hidden shrink-0 flex-col border-r border-line bg-white lg:flex lg:w-[248px]'
        }
      >
        <div className="flex items-center justify-between px-4 py-4">
          <BrandMark />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-muted hover:bg-line-soft hover:text-ink lg:hidden"
          >
            <X className="h-[18px] w-[18px] stroke-[1.8]" />
          </button>
        </div>
        <LocationSwitcher variant="sidebar" />
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3" aria-label="App">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => {
                      const active = navActive(location.pathname, item, isActive);
                      return `flex min-h-10 items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium ${
                        active ? 'bg-blue-50 font-semibold text-brand-dark' : 'text-muted hover:bg-line-soft hover:text-ink'
                      }`;
                    }}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0 stroke-[1.8]" />
                    <span className="min-w-0 flex-1 leading-5">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {expiredCount > 0 && expiredLabel ? (
          <div className="mx-3 mb-3 rounded-[10px] border border-amber-line bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-semibold">Plan expired {expiredLabel}</p>
            <p className="mt-1">Renew to keep your QR codes and review page live.</p>
            <Link to="/app/subscription" className="mt-2 inline-block font-semibold text-amber-800 underline">
              Renew plan →
            </Link>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ImpersonationBanner />
        <header className="hidden items-center gap-4 border-b border-line bg-white px-8 py-3.5 lg:flex">
          <label className="relative min-w-0 flex-1 max-w-xl">
            <span className="sr-only">Search</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted stroke-[1.8]"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search customers, products, reviews"
              className="w-full min-h-11 rounded-[10px] border border-[#CBD5E1] bg-white py-2 pl-10 pr-3 text-sm text-ink"
            />
          </label>
          <IconButton aria-label="Notifications" className="relative">
            <Bell className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
            {inboxUnread > 0 ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-700" aria-hidden />
            ) : null}
          </IconButton>
          <AppAccountMenu />
        </header>
        <main className="px-4 py-5 sm:px-7 sm:py-7 lg:px-8 lg:pb-14">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

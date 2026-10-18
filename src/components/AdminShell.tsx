import {
  Activity,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  QrCode,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AdminGlobalSearch } from './admin/AdminGlobalSearch';
import '../styles/admin-tokens.css';

type NavCounts = {
  desk: number;
  supportInbox: number;
  payments: number;
  hardwareOrders: number;
};

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  countKey?: keyof NavCounts;
  isActive: (pathname: string) => boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Work',
    items: [
      {
        to: '/admin',
        label: 'Desk',
        icon: LayoutDashboard,
        countKey: 'desk',
        isActive: (p) => p === '/admin' || p === '/admin/',
      },
      {
        to: '/admin/contact',
        label: 'Support inbox',
        icon: MessageSquare,
        countKey: 'supportInbox',
        isActive: (p) => p.startsWith('/admin/contact'),
      },
      {
        to: '/admin/counter-sale',
        label: 'Counter sale',
        icon: Smartphone,
        isActive: (p) => p.startsWith('/admin/counter-sale'),
      },
    ],
  },
  {
    label: 'Merchants',
    items: [
      {
        to: '/admin/merchants',
        label: 'Merchants',
        icon: Users,
        isActive: (p) => p.startsWith('/admin/merchants'),
      },
      {
        to: '/admin/locations',
        label: 'Locations',
        icon: MapPin,
        isActive: (p) => p.startsWith('/admin/locations'),
      },
    ],
  },
  {
    label: 'Money',
    items: [
      {
        to: '/admin/payments',
        label: 'Payments',
        icon: CreditCard,
        countKey: 'payments',
        isActive: (p) => p === '/admin/payments' || p.startsWith('/admin/payments?'),
      },
      {
        to: '/admin/plans',
        label: 'Plans & prices',
        icon: Store,
        isActive: (p) => p.startsWith('/admin/plans'),
      },
    ],
  },
  {
    label: 'Fulfilment',
    items: [
      {
        to: '/admin/hardware-orders',
        label: 'Hardware orders',
        icon: Package,
        countKey: 'hardwareOrders',
        isActive: (p) => p.startsWith('/admin/hardware-orders'),
      },
      {
        to: '/admin/qr',
        label: 'QR stock',
        icon: QrCode,
        isActive: (p) => p.startsWith('/admin/qr'),
      },
      {
        to: '/admin/store-catalogue',
        label: 'Store catalogue',
        icon: ShoppingBag,
        isActive: (p) => p.startsWith('/admin/store-catalogue'),
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        to: '/admin/activity',
        label: 'Activity log',
        icon: Activity,
        isActive: (p) => p.startsWith('/admin/activity'),
      },
    ],
  },
];

export function AdminShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    void api<NavCounts>('/api/admin/nav-counts')
      .then(setCounts)
      .catch(() => setCounts(null));
  }, [location.pathname]);

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

  async function logout() {
    await signOut();
    navigate('/', { replace: true });
  }

  const pathname = location.pathname;

  return (
    <div className="admin-shell min-h-dvh lg:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 px-4 py-3 backdrop-blur lg:hidden">
        <img src="/brand/quickreview-icon.png" alt="QuickReview" className="h-8 w-8 object-contain" />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--admin-radius-ctl)] text-[var(--admin-text)] hover:bg-[var(--admin-border-soft)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#101828]/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={
          menuOpen
            ? 'fixed inset-y-0 left-0 z-50 flex w-[232px] max-w-[88vw] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl'
            : 'hidden w-[232px] shrink-0 border-r border-[var(--admin-border)] bg-[var(--admin-surface)] lg:flex lg:flex-col'
        }
      >
        <div className="flex items-center justify-between px-4 py-5">
          <Link to="/admin" className="block">
            <img
              src="/brand/quickreview-wordmark.png"
              alt="QuickReview"
              width={150}
              height={50}
              className="h-auto w-[150px] object-contain object-left"
            />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--admin-radius-ctl)] text-[var(--admin-muted)] hover:bg-[var(--admin-border-soft)] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-subtle)]">
          Super admin
        </p>
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-3" aria-label="Super Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-subtle)]">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.isActive(pathname);
                  const badge =
                    item.countKey && counts && counts[item.countKey] > 0 ? counts[item.countKey] : null;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex min-h-9 items-center justify-between gap-2 rounded-[var(--admin-radius-ctl)] px-3 py-2 text-sm font-semibold ${
                        active
                          ? 'admin-nav-active'
                          : 'text-[var(--admin-muted)] hover:bg-[var(--admin-border-soft)] hover:text-[var(--admin-text)]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </span>
                      {badge ? (
                        <span className="rounded-full bg-[var(--admin-text)] px-2 py-0.5 text-xs font-bold text-white">
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-[var(--admin-border)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{user?.name}</p>
          <p className="truncate text-xs text-[var(--admin-muted)]">{user?.email}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-3 lg:flex">
          <AdminGlobalSearch />
          <span className="rounded-full border border-[var(--admin-success-soft)] bg-[var(--admin-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--admin-success)]">
            Live
          </span>
        </div>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

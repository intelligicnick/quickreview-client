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
  Store,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { BrandMark } from './BrandMark';

type NavCounts = {
  desk: number;
  supportInbox: number;
  payments: number;
  hardwareOrders: number;
};

const NAV_GROUPS = [
  {
    label: 'Work',
    items: [
      { to: '/admin', label: 'Desk', icon: LayoutDashboard, end: true as const, countKey: 'desk' as const },
      {
        to: '/admin/contact',
        label: 'Support inbox',
        icon: MessageSquare,
        end: false as const,
        countKey: 'supportInbox' as const,
      },
    ],
  },
  {
    label: 'Merchants',
    items: [
      { to: '/admin/merchants', label: 'Merchants', icon: Users, end: false as const },
      { to: '/admin/locations', label: 'Locations', icon: MapPin, end: false as const },
    ],
  },
  {
    label: 'Money',
    items: [
      {
        to: '/admin/payments',
        label: 'Payments',
        icon: CreditCard,
        end: false as const,
        countKey: 'payments' as const,
      },
      { to: '/admin/payments#plans', label: 'Plans & prices', icon: Store, end: false as const },
    ],
  },
  {
    label: 'Fulfilment',
    items: [
      {
        to: '/admin/marketplace',
        label: 'Hardware orders',
        icon: Package,
        end: false as const,
        countKey: 'hardwareOrders' as const,
      },
      { to: '/admin/qr', label: 'QR stock', icon: QrCode, end: false as const },
      { to: '/admin/marketplace#catalogue', label: 'Store catalogue', icon: ShoppingBag, end: false as const },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/activity', label: 'Activity log', icon: Activity, end: false as const },
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

  return (
    <div className="min-h-dvh bg-paper lg:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <BrandMark />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-paper"
        >
          <Menu className="h-5 w-5" />
        </button>
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
            ? 'fixed inset-y-0 left-0 z-50 flex w-[min(18.5rem,88vw)] flex-col border-r border-line bg-white shadow-xl'
            : 'hidden border-r border-line bg-white lg:static lg:flex lg:w-72 lg:flex-col'
        }
      >
        <div className="flex items-center justify-between px-5 py-5">
          <BrandMark />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-5 pb-3 text-xs font-semibold uppercase tracking-wide text-muted">Super Admin</p>
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3" aria-label="Super Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[0.65rem] font-bold uppercase tracking-wider text-muted/80">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const badge =
                    item.countKey && counts && counts[item.countKey] > 0 ? counts[item.countKey] : null;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                          isActive ? 'bg-brand/10 text-brand-dark' : 'text-muted hover:bg-paper hover:text-ink'
                        }`
                      }
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </span>
                      {badge ? (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">{badge}</span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-line px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

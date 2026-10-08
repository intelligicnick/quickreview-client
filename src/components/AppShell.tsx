import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  UtensilsCrossed,
  IdCard,
  Palette,
  ScanLine,
  Users,
  X,
} from 'lucide-react';
import { CRM_BASE } from '../lib/crm/paths';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BrandMark } from './BrandMark';
import { ImpersonationBanner } from './ImpersonationBanner';
import { LocationSwitcher } from './LocationSwitcher';

/** Flat nav matching legacy EasyReview merchant panel (see docs/PHASES.md). */
const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: CRM_BASE, label: 'Quick CRM', icon: Users, end: false, matchPrefix: CRM_BASE },
  { to: '/app/quickreview', label: 'QuickReview', icon: Star, end: false },
  { to: '/app/quickcommerce', label: 'QuickCommerce', icon: UtensilsCrossed, end: false, matchPrefix: '/app/quickcommerce' },
  { to: '/app/quickconnect', label: 'QuickConnect', icon: IdCard, end: false },
  { to: '/app/quickdesign', label: 'QuickDesign', icon: Palette, end: false },
  { to: '/app/quickscan', label: 'QuickScan', icon: ScanLine, end: false },
  { to: '/app/qr', label: 'QR codes', icon: QrCode, end: false },
  { to: '/app/marketplace', label: 'Marketplace', icon: ShoppingBag, end: false },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard, end: false },
  { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
];

export function AppShell() {
  const { user, signOut, impersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
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
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
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
        </div>
        <div className="border-t border-line px-4 py-3">
          <LocationSwitcher compact />
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
        {user?.isSuperAdmin && !impersonation ? (
          <NavLink
            to="/admin"
            className="mx-3 mb-2 flex min-h-11 items-center gap-2.5 rounded-xl bg-ink px-3 py-2.5 text-sm font-semibold text-white"
          >
            <Shield className="h-4 w-4 shrink-0" />
            Super Admin
          </NavLink>
        ) : null}
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3" aria-label="App">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const active =
                  isActive ||
                  ('matchPrefix' in item &&
                    item.matchPrefix &&
                    location.pathname.startsWith(item.matchPrefix));
                return `flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? 'bg-brand/10 text-brand-dark' : 'text-muted hover:bg-paper hover:text-ink'
                }`;
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 leading-5">{item.label}</span>
            </NavLink>
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
        <ImpersonationBanner />
        <header className="hidden items-center justify-between gap-4 border-b border-line bg-white/80 px-8 py-4 backdrop-blur lg:flex">
          <LocationSwitcher />
          <p className="text-sm text-muted">Merchant panel</p>
        </header>
        <main className="px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

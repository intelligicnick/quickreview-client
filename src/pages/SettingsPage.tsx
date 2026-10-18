import { ChevronRight, CreditCard, IdCard, LogOut, ShoppingBag, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { useAuth } from '../lib/auth';
import { initialsFromName } from '../lib/initials';
import { useLocationContext } from '../lib/location-context';

const PRODUCT_LINKS = [
  { to: '/app/quickreview', label: 'QuickReview', icon: Star, blurb: 'Reviews, inbox, QR' },
  { to: '/app/quickcommerce', label: 'QuickCommerce', icon: ShoppingBag, blurb: 'Catalogue & revisit' },
  { to: '/app/quickconnect', label: 'QuickConnect', icon: IdCard, blurb: 'Digital business card' },
  { to: '/app/subscription', label: 'Plans & billing', icon: CreditCard, blurb: 'Renew products' },
] as const;

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { locations, selected } = useLocationContext();

  async function logout() {
    await signOut();
    navigate('/', { replace: true });
  }

  const initials = initialsFromName(user?.name || user?.email || '?');

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        breadcrumb="This location / Settings"
        title="Settings"
        description="Account, businesses, and product shortcuts for this location."
      />

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Account</h2>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-brand-dark">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-ink">{user?.name}</p>
              {user?.isSuperAdmin ? <StatusPill variant="pending" label="Super Admin" /> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{user?.email}</span>
              {user?.emailVerified ? <StatusPill variant="active" label="Verified" /> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" type="button">Edit profile</Button>
              {user?.isSuperAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex min-h-9 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/90"
                >
                  Super Admin console
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Businesses & locations</h2>
        <p className="mt-2 text-sm text-muted">
          Import from Google Business Profile. Products and billing are per location.
        </p>
        <Link
          to="/app/businesses"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-brand text-sm font-semibold text-white hover:bg-brand-dark sm:w-auto sm:px-6"
        >
          Import from Google Business Profile
        </Link>
        <ul className="mt-4 divide-y divide-line">
          {locations.slice(0, 5).map((loc) => (
            <li key={loc.id} className="flex items-center justify-between gap-2 py-3 text-sm">
              <span className="font-semibold text-ink">{loc.name}</span>
              {loc.id === selected?.id ? <StatusPill variant="live" label="Current" /> : null}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/app/locations" className="text-brand">
            View all locations ({locations.length})
          </Link>
          <Link to="/app/businesses" className="text-brand">Manage businesses</Link>
          <Link to="/app/businesses" className="text-brand">+ Add location</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Product settings</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRODUCT_LINKS.map((row) => (
            <Link
              key={row.to}
              to={row.to}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 hover:border-brand/30"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
                <row.icon className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{row.label}</span>
                <span className="block text-xs text-muted">{row.blurb}</span>
              </span>
              <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-white text-sm font-semibold text-ink hover:bg-surface-2"
      >
        <LogOut className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
        Sign out
      </button>
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  ChevronRight,
  CreditCard,
  IdCard,
  LogOut,
  Palette,
  QrCode,
  ScanLine,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { useAuth } from '../lib/auth';
import { initialsFromName } from '../lib/initials';
import { useLocationContext } from '../lib/location-context';
import { CRM_BASE } from '../lib/crm/paths';

const PRODUCT_LINKS = [
  { to: '/app/quickreview', label: 'QuickReview', icon: Star, blurb: 'Reviews, inbox, QR' },
  { to: '/app/quickcommerce', label: 'QuickCommerce', icon: ShoppingBag, blurb: 'Catalogue & revisit' },
  { to: CRM_BASE, label: 'CRM', icon: Users, blurb: 'Customers, quotes, invoices' },
  { to: '/app/quickconnect', label: 'QuickConnect', icon: IdCard, blurb: 'Digital business card' },
  { to: '/app/quickdesign', label: 'QuickDesign', icon: Palette, blurb: 'Posters for social' },
  { to: '/app/quickscan', label: 'QuickScan', icon: ScanLine, blurb: 'Scan cards → CRM' },
  { to: '/app/qr', label: 'QR codes & standees', icon: QrCode, blurb: 'Print & link standees' },
  { to: '/app/subscription', label: 'Plans & billing', icon: CreditCard, blurb: 'Renew products' },
] as const;

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { locations, selected, setSelectedId } = useLocationContext();
  const [profileOpen, setProfileOpen] = useState(false);

  async function logout() {
    await signOut();
    navigate('/', { replace: true });
  }

  const initials = initialsFromName(user?.name || user?.email || '?');

  const businessesGrouped = useMemo(() => {
    const map = new Map<
      string,
      { businessId: string; businessName: string; locations: typeof locations }
    >();
    for (const loc of locations) {
      const bucket = map.get(loc.businessId) ?? {
        businessId: loc.businessId,
        businessName: loc.businessName,
        locations: [],
      };
      bucket.locations.push(loc);
      map.set(loc.businessId, bucket);
    }
    return [...map.values()].sort((a, b) => a.businessName.localeCompare(b.businessName));
  }, [locations]);

  return (
    <div className="space-y-4">
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
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Name</dt>
                <dd className="mt-1 font-semibold text-ink">{user?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Email</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{user?.email}</span>
                  {user?.emailVerified ? <StatusPill variant="active" label="Verified" /> : null}
                </dd>
              </div>
              {user?.isSuperAdmin ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Role</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusPill variant="pending" label="Super Admin" />
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setProfileOpen(true)}>
                Edit profile
              </Button>
            </div>
            {user?.isSuperAdmin ? (
              <div className="mt-4 rounded-[10px] border border-line bg-paper px-4 py-3">
                <p className="text-sm text-body">
                  You can see every business, approve UPI/cash payments and manage Marketplace orders.
                </p>
                <Link
                  to="/admin"
                  className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Open Super Admin console →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Businesses & locations</h2>
        <p className="mt-2 text-sm text-muted">Products and billing are set up per location.</p>
        <Link
          to="/app/businesses"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface-2 sm:w-auto"
        >
          Import from Google
        </Link>
        <div className="mt-5 space-y-4">
          {businessesGrouped.map((group) => (
            <article key={group.businessId} className="rounded-xl border border-line bg-paper/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-dark">
                    {initialsFromName(group.businessName)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{group.businessName}</p>
                    <p className="text-xs text-muted">
                      {group.locations.length} location{group.locations.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/app/businesses/${group.businessId}`}
                  className="text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Manage business
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
                {group.locations.map((loc) => {
                  const isCurrent = loc.id === selected?.id;
                  return (
                    <li key={loc.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-semibold text-ink">{loc.name}</span>
                      {isCurrent ? (
                        <StatusPill variant="live" label="Viewing now" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedId(loc.id)}
                          className="text-left text-sm font-semibold text-brand hover:text-brand-dark sm:text-right"
                        >
                          Switch to this location
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
          {businessesGrouped.length === 0 ? (
            <p className="text-sm text-muted">No locations yet. Import from Google to get started.</p>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link to="/app/locations" className="text-brand">
            View all locations ({locations.length})
          </Link>
          <Link to="/app/businesses" className="text-brand">
            + Add business
          </Link>
          <Link to="/app/businesses" className="text-brand">
            + Add location
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Product settings</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-white text-sm font-semibold text-ink hover:bg-surface-2"
        >
          <LogOut className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
          Sign out
        </button>
        <p className="text-center text-xs text-muted">Signs you out on this device only.</p>
      </div>

      {profileOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-dialog-title"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setProfileOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h2 id="profile-dialog-title" className="font-display text-lg font-bold text-ink">
              Profile
            </h2>
            <p className="mt-1 text-sm text-muted">Name and email are managed by your login account.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Name</dt>
                <dd className="mt-1 font-semibold">{user?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Email</dt>
                <dd className="mt-1 font-semibold">{user?.email}</dd>
              </div>
            </dl>
            <Button variant="secondary" size="sm" type="button" className="mt-6 w-full" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

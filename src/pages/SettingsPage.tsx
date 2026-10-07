import { Building2, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../lib/auth';
import { useLocationContext } from '../lib/location-context';

export function SettingsPage() {
  const { user } = useAuth();
  const { locations } = useLocationContext();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Settings"
        description="Account, businesses, and locations — configuration that applies across products."
      />

      <section className="mt-8 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <User className="h-4 w-4" />
          Account
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="font-semibold">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-semibold">{user?.email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Email verified</dt>
            <dd className="font-semibold">
              {user?.emailVerified ? (
                'Yes'
              ) : (
                <>
                  No —{' '}
                  <Link to="/verify-email" className="text-brand underline">
                    verify now
                  </Link>
                </>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <Building2 className="h-4 w-4" />
          Businesses & locations
        </div>
        <p className="mt-2 text-sm text-muted">
          Import from Google Business Profile. Each business can have multiple locations — products and billing are per
          location.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/app/businesses"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Building2 className="h-4 w-4" />
            Manage businesses
          </Link>
          <Link
            to="/app/locations"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand/40"
          >
            <MapPin className="h-4 w-4" />
            All locations ({locations.length})
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-line bg-white/60 p-5 text-sm text-muted">
        <p className="font-semibold text-ink">Product settings</p>
        <p className="mt-1">
          Edit review keywords in{' '}
          <Link to="/app/quickreview" className="font-semibold text-brand">QuickReview</Link>, menu in{' '}
          <Link to="/app/quickmenu" className="font-semibold text-brand">Quick Commerce</Link>, and your card in{' '}
          <Link to="/app/quickconnect" className="font-semibold text-brand">QuickConnect</Link>.
        </p>
      </section>
    </div>
  );
}

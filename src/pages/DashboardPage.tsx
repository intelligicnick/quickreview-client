import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  IdCard,
  MapPin,
  Plus,
  QrCode,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { GoogleImportPanel } from '../components/GoogleImportPanel';
import { PageHeader } from '../components/PageHeader';
import { loadWorkspaceSnapshot, productStatusLabel } from '../lib/location-workspace';
import { useAuth } from '../lib/auth';
import { useLocationContext } from '../lib/location-context';

export function DashboardPage() {
  const { user } = useAuth();
  const { selected, locations, loading, refresh } = useLocationContext();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadWorkspaceSnapshot>> | null>(null);

  useEffect(() => {
    if (!selected) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    void loadWorkspaceSnapshot(selected.id).then((data) => {
      if (!cancelled) setSnapshot(data);
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const review = snapshot?.review;
  const menu = snapshot?.menu;
  const connect = snapshot?.connect;
  const lockedProducts =
    snapshot &&
    [
      review && !review.reviewUnlocked,
      menu && !menu.menuUnlocked,
      connect && !connect.connectUnlocked,
    ].filter(Boolean).length;

  const pendingPayment =
    snapshot &&
    [review?.reviewAccess.status, menu?.menuAccess.status, connect?.connectAccess.status].some(
      (s) => s === 'PENDING_PAYMENT',
    );

  const needsGoogle = review && !review.googleReviewUrl;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          selected
            ? `Operate ${selected.name} — alerts, quick actions, and live status.`
            : `Welcome${user?.name ? `, ${user.name}` : ''}. Add a shop to unlock reviews, menus, and QR codes.`
        }
        actions={
          selected ? (
            <Link
              to="/app/qr"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <QrCode className="h-4 w-4" />
              QR codes
            </Link>
          ) : (
            <span className="text-sm text-muted">Import your shop below</span>
          )
        }
      />

      {!loading && locations.length === 0 ? (
        <div className="mt-6">
          <GoogleImportPanel onImported={() => void refresh()} />
        </div>
      ) : null}

      {!user?.emailVerified ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Verify your email before creating a business.{' '}
            <Link className="font-semibold underline" to="/verify-email">
              Verify now
            </Link>
          </p>
        </div>
      ) : null}

      {selected && pendingPayment ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Payment pending confirmation.{' '}
            <Link to="/app/subscription" className="font-semibold underline">
              View billing
            </Link>
          </p>
        </div>
      ) : null}

      {selected && lockedProducts ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            {lockedProducts} product{lockedProducts === 1 ? '' : 's'} need an active plan.{' '}
            <Link to="/app/subscription" className="font-semibold text-brand">
              Activate plans
            </Link>{' '}
            or preview locked QR codes on{' '}
            <Link to="/app/qr" className="font-semibold text-brand">
              QR codes
            </Link>
            .
          </p>
        </div>
      ) : null}

      {selected && needsGoogle ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p>
            Connect Google review URL for this location in{' '}
            <Link to={`/app/businesses/${selected.businessId}`} className="font-semibold text-brand">
              business settings
            </Link>{' '}
            so 4–5 star ratings can hand off to Google.
          </p>
        </div>
      ) : null}

      {selected && review ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Today at a glance</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Page views', value: review.stats.pageViews },
              { label: 'Star taps', value: review.stats.stars },
              { label: 'Private feedback', value: review.stats.privateFeedback },
              { label: 'Google opens', value: review.stats.googleOpens },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
                <p className="mt-2 text-2xl font-extrabold">{card.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickAction to="/app/businesses" icon={Plus} label="Add business" />
          {selected ? (
            <>
              <QuickAction to="/app/quickreview" icon={Star} label="Reviews" />
              <QuickAction to="/app/quickmenu" icon={UtensilsCrossed} label="Quick Commerce" />
              <QuickAction to="/app/quickconnect" icon={IdCard} label="Edit card" />
              <QuickAction to="/app/qr" icon={QrCode} label="QR codes" />
              <QuickAction to="/app/marketplace" icon={ShoppingBag} label="Order standee" />
            </>
          ) : null}
        </div>
      </section>

      {selected && snapshot ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Products for this location</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {review ? (
              <ProductStatusCard
                title="QuickReview"
                icon={Star}
                status={productStatusLabel(review.reviewUnlocked, review.reviewAccess.status)}
                active={review.reviewUnlocked}
                href="/app/quickreview"
                detail={`${review.stats.privateFeedback} private messages`}
              />
            ) : null}
            {menu ? (
              <ProductStatusCard
                title="Quick Commerce"
                icon={UtensilsCrossed}
                status={productStatusLabel(menu.menuUnlocked, menu.menuAccess.status)}
                active={menu.menuUnlocked}
                href="/app/quickmenu"
                detail="Guest menu & catalogue"
              />
            ) : null}
            {connect ? (
              <ProductStatusCard
                title="QuickConnect"
                icon={IdCard}
                status={productStatusLabel(connect.connectUnlocked, connect.connectAccess.status)}
                active={connect.connectUnlocked}
                href="/app/quickconnect"
                detail={`${connect.leadCount} leads captured`}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {!loading && locations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white/70 p-6 text-center sm:p-8">
          <p className="font-semibold">No shop yet</p>
          <p className="mt-1 text-sm text-muted">
            Import from Google Business Profile — then pick a location to manage products.
          </p>
          <Link
            to="/app/businesses"
            className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Get started
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Star;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold hover:border-brand/40"
    >
      <Icon className="h-4 w-4 text-brand" />
      {label}
    </Link>
  );
}

function ProductStatusCard({
  title,
  icon: Icon,
  status,
  active,
  href,
  detail,
}: {
  title: string;
  icon: typeof Star;
  status: string;
  active: boolean;
  href: string;
  detail: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            active ? 'bg-brand/10 text-brand-dark' : 'bg-paper text-muted'
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </Link>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  IdCard,
  Palette,
  ScanLine,
  Star,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { GoogleImportPanel } from '../components/GoogleImportPanel';
import { PageHeader } from '../components/PageHeader';
import { ProductStatusBadge } from '../components/ProductStatusBadge';
import { loadWorkspaceSnapshot } from '../lib/location-workspace';
import { useAuth } from '../lib/auth';
import { useLocationContext } from '../lib/location-context';
import { CRM_BASE } from '../lib/crm/paths';

type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  action: string;
};

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
  const billing = snapshot?.billing;

  const attention = useMemo(() => {
    if (!selected || !billing) return [];
    const items: AttentionItem[] = [];
    const products: { key: string; name: string; access: { unlocked: boolean; status: string } }[] = [
      { key: 'review', name: 'QuickReview', access: billing.quickReview },
      { key: 'menu', name: 'QuickCommerce', access: billing.quickMenu },
      { key: 'crm', name: 'QuickCRM', access: billing.quickCrm },
      { key: 'connect', name: 'QuickConnect', access: billing.quickConnect },
      { key: 'design', name: 'QuickDesign', access: billing.quickDesign },
      { key: 'scan', name: 'QuickScan', access: billing.quickScan },
    ];
    for (const p of products) {
      if (p.access.status === 'PENDING_PAYMENT') {
        items.push({
          id: `pay-${p.key}`,
          title: `${p.name} — payment awaiting confirmation`,
          detail: 'Complete Razorpay or wait for UPI/cash approval.',
          href: '/app/subscription',
          action: 'View billing',
        });
      } else if (!p.access.unlocked && p.access.status !== 'PENDING_PAYMENT') {
        items.push({
          id: `plan-${p.key}`,
          title: `${p.name} needs an active plan`,
          detail: 'Unlock public links and QR codes for this product.',
          href: '/app/subscription',
          action: 'Choose plan',
        });
      }
    }
    if (review && !review.googleReviewUrl) {
      items.push({
        id: 'google',
        title: 'QuickReview — Google review URL missing',
        detail: '4–5★ guests cannot open Google until you add the write-review link.',
        href: `/app/businesses/${selected.businessId}`,
        action: 'Add URL',
      });
    }
    return items.slice(0, 3);
  }, [selected, billing, review]);

  const setupSteps = useMemo(() => {
    if (!selected || !snapshot) return [];
    const hasGoogle = Boolean(review?.googleReviewUrl);
    const hasMenu = Boolean(menu?.menuUnlocked);
    const hasCard = Boolean(connect?.connectUnlocked);
    const hasQr =
      Boolean(review?.reviewUnlocked) || Boolean(menu?.menuUnlocked) || Boolean(connect?.connectUnlocked);
    return [
      { done: hasGoogle, label: 'Connect Google review URL', href: `/app/businesses/${selected.businessId}` },
      { done: hasMenu, label: 'Add products to QuickCommerce', href: '/app/quickcommerce' },
      { done: hasCard, label: 'Fill your QuickConnect card', href: '/app/quickconnect' },
      { done: hasQr, label: 'Print or order a QR standee', href: '/app/qr' },
    ];
  }, [selected, snapshot, review, menu, connect]);

  const setupComplete = setupSteps.length > 0 && setupSteps.every((s) => s.done);

  const productRows = useMemo(() => {
    if (!billing) return [];
    return [
      {
        title: 'QuickReview',
        icon: Star,
        href: '/app/quickreview',
        unlocked: billing.quickReview.unlocked,
        status: billing.quickReview.status,
        detail: review ? `${review.stats.privateFeedback} private messages` : 'Reviews & inbox',
      },
      {
        title: 'QuickCommerce',
        icon: UtensilsCrossed,
        href: '/app/quickcommerce',
        unlocked: billing.quickMenu.unlocked,
        status: billing.quickMenu.status,
        detail: 'Menu, catalogue & Quick Revisit',
      },
      {
        title: 'QuickCRM',
        icon: Users,
        href: CRM_BASE,
        unlocked: billing.quickCrm.unlocked,
        status: billing.quickCrm.status,
        detail: 'Quotes, invoices & follow-ups',
      },
      {
        title: 'QuickConnect',
        icon: IdCard,
        href: '/app/quickconnect',
        unlocked: billing.quickConnect.unlocked,
        status: billing.quickConnect.status,
        detail: connect ? `${connect.leadCount} leads captured` : 'Digital business card',
      },
      {
        title: 'QuickDesign',
        icon: Palette,
        href: '/app/quickdesign',
        unlocked: billing.quickDesign.unlocked,
        status: billing.quickDesign.status,
        detail: 'Posters for WhatsApp & Instagram',
      },
      {
        title: 'QuickScan',
        icon: ScanLine,
        href: '/app/quickscan',
        unlocked: billing.quickScan.unlocked,
        status: billing.quickScan.status,
        detail: 'Scan cards → save to CRM',
      },
    ];
  }, [billing, review, connect]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          selected
            ? `${selected.name} — setup, alerts, and product status for this location.`
            : `Welcome${user?.name ? `, ${user.name}` : ''}. Add a shop to unlock reviews, menus, and QR codes.`
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

      {selected && attention.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Needs attention</h2>
          <ul className="mt-3 space-y-2">
            {attention.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-950">{item.title}</p>
                  <p className="mt-0.5 text-sm text-amber-900/90">{item.detail}</p>
                </div>
                <Link
                  to={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white hover:bg-amber-950"
                >
                  {item.action}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected && !setupComplete ? (
        <section className="mt-6 rounded-2xl border border-line bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Setup checklist</h2>
          <ul className="mt-3 space-y-2">
            {setupSteps.map((step) => (
              <li key={step.label}>
                <Link
                  to={step.href}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 hover:bg-paper"
                >
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-line" />
                  )}
                  <span className={`text-sm font-medium ${step.done ? 'text-muted line-through' : 'text-ink'}`}>
                    {step.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected && review ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Today at a glance</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Page views', value: review.stats.pageViews, hint: 'Guest opens on your review link' },
              { label: 'Star taps', value: review.stats.stars, hint: 'Guests who picked a rating' },
              { label: 'Private feedback', value: review.stats.privateFeedback, hint: 'Low-rating messages in inbox' },
              { label: 'Google opens', value: review.stats.googleOpens, hint: 'Taps through to Google' },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-line bg-white p-4" title={card.hint}>
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
          {selected ? (
            <>
              <QuickAction to={`${CRM_BASE}/quotations/new`} label="New quotation" />
              <QuickAction to="/app/quickscan" label="Scan card" />
              <QuickAction to="/app/quickdesign" label="Make poster" />
              <QuickAction to="/app/quickreview" label="Share review link" />
            </>
          ) : (
            <QuickAction to="/app/businesses" label="Add business" />
          )}
        </div>
      </section>

      {selected && productRows.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Products for this location</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productRows.map((row) => (
              <ProductStatusCard key={row.title} {...row} />
            ))}
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

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-10 items-center rounded-xl border border-line bg-white px-3.5 text-sm font-semibold hover:border-brand/40"
    >
      {label}
    </Link>
  );
}

function ProductStatusCard({
  title,
  icon: Icon,
  status,
  unlocked,
  href,
  detail,
}: {
  title: string;
  icon: typeof Star;
  status: string;
  unlocked: boolean;
  href: string;
  detail: string;
}) {
  const next =
    unlocked ? 'Open' : status === 'PENDING_PAYMENT' ? 'Finish payment in billing' : 'Activate in billing';

  return (
    <Link
      to={unlocked ? href : '/app/subscription'}
      className="group rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-4 w-4" />
        </span>
        <ProductStatusBadge unlocked={unlocked} status={status} />
      </div>
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
      <p className="mt-3 text-sm font-semibold text-brand group-hover:underline">{next}</p>
    </Link>
  );
}

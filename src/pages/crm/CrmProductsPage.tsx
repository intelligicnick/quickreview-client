import { Link } from 'react-router-dom';
import { CommerceSyncBanner } from '../../components/crm/CommerceSyncBanner';
import { EmptyState } from '../../components/crm/EmptyState';
import { formatInr } from '../../lib/crm/format';
import { crmPath } from '../../lib/crm/paths';
import { useCrm } from '../../lib/crm/context';

export function CrmProductsPage() {
  const { state } = useCrm();
  const synced = state.catalog.filter((c) => c.commerceItemId);
  const local = state.catalog.filter((c) => !c.commerceItemId);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to={crmPath('more')} className="text-sm font-semibold text-brand">← More</Link>
      <h1 className="font-display text-2xl font-bold">Catalog for CRM</h1>
      <p className="text-sm text-muted">
        Items come from <strong>Quick Commerce</strong>. Edit prices and names there — then sync here for quotations and invoices.
      </p>
      <CommerceSyncBanner />

      {synced.length === 0 && local.length === 0 ? (
        <EmptyState
          title="No catalog items"
          description="Set up Quick Commerce and tap Sync now to use your menu/products in quotes."
          action={
            <Link to="/app/quickcommerce" className="btn-gradient w-full">Open Quick Commerce</Link>
          }
        />
      ) : (
        <>
          {synced.length > 0 ? (
            <section>
              <h2 className="text-xs font-bold uppercase text-muted">From Quick Commerce</h2>
              <ul className="mt-2 space-y-2">
                {synced.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted">{item.commerceCategory}</p>
                    </div>
                    <p className="font-display font-bold">{formatInr(item.price)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {local.length > 0 ? (
            <section>
              <h2 className="text-xs font-bold uppercase text-muted">Local only (legacy)</h2>
              <ul className="mt-2 space-y-2">
                {local.map((item) => (
                  <li key={item.id} className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
                    {item.name} — {formatInr(item.price)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

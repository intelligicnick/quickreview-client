import { Link, useNavigate } from 'react-router-dom';
import { CommerceSyncBanner } from '../../components/crm/CommerceSyncBanner';
import { CustomerCard } from '../../components/crm/CustomerCard';
import { DocCard } from '../../components/crm/DocCard';
import { StatTile } from '../../components/ui/StatTile';
import { formatInr, isToday, pendingAmount } from '../../lib/crm/format';
import { crmPath } from '../../lib/crm/paths';
import { useCrm } from '../../lib/crm/context';

export function CrmHomePage() {
  const navigate = useNavigate();
  const { state, customerById, logCall, convertQuotationToInvoice } = useCrm();
  const customers = state.customers.length;
  const quotes = state.quotations.filter((q) => q.documentType === 'quotation');
  const invoices = state.quotations.filter((q) => q.documentType === 'invoice');
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const openQuotes = quotes.filter((q) => q.status === 'sent' || q.status === 'draft');
  const openQuotesValue = openQuotes.reduce((sum, q) => sum + q.total, 0);
  const unpaidInvoiceTotal = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);
  const salesPending = state.sales.reduce((sum, s) => sum + pendingAmount(s), 0);
  const dueToday = state.followUps.filter((f) => !f.completedAt && isToday(f.dueAt));
  const nextFollowUp = state.followUps
    .filter((f) => !f.completedAt)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];

  const recentCustomers = state.customers.slice(0, 3);
  const recentQuotes = openQuotes.slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Customers" value={customers} helper="View all" onClick={() => navigate(crmPath('customers'))} />
        <StatTile
          label="Open quotations"
          value={formatInr(openQuotesValue)}
          helper={`${openQuotes.length} open`}
          onClick={() => navigate(crmPath('quotations'))}
        />
        <StatTile
          label="Unpaid invoices"
          value={formatInr(unpaidInvoiceTotal)}
          helper={`${unpaidInvoices.length} to collect`}
          onClick={() => navigate(crmPath('invoices'))}
        />
        <StatTile
          label="Sales balance"
          value={formatInr(salesPending)}
          helper="Recorded sales not fully paid"
          onClick={() => navigate(crmPath('sales'))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {recentQuotes.length > 0 ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-ink">Recent quotations</h2>
                <Link to={crmPath('quotations')} className="text-sm font-semibold text-brand">View all</Link>
              </div>
              <ul className="mt-3 space-y-3">
                {recentQuotes.map((doc) => {
                  const customer = customerById(doc.customerId);
                  if (!customer) return null;
                  return (
                    <li key={doc.id}>
                      <DocCard doc={doc} customer={customer} onConvert={() => convertQuotationToInvoice(doc.id)} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-ink">Customers</h2>
              <Link to={crmPath('customers')} className="text-sm font-semibold text-brand">View all</Link>
            </div>
            <ul className="mt-3 space-y-3">
              {recentCustomers.length === 0 ? (
                <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                  Add customers to send quotes and invoices.
                </li>
              ) : (
                recentCustomers.map((c) => (
                  <li key={c.id}>
                    <CustomerCard customer={c} onCall={() => logCall(c.id)} />
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Up next</h2>
            {nextFollowUp ? (
              <Link to={crmPath('follow-ups')} className="mt-2 block text-sm font-semibold text-ink">
                {nextFollowUp.reason || 'Follow-up'} ·{' '}
                {new Date(nextFollowUp.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Link>
            ) : (
              <p className="mt-2 text-sm text-muted">No follow-ups scheduled.</p>
            )}
            {dueToday.length > 0 ? (
              <p className="mt-2 text-sm text-brand">
                {dueToday.length} due today —{' '}
                <Link to={crmPath('follow-ups')} className="font-semibold underline">open follow-ups</Link>
              </p>
            ) : null}
          </div>
          <CommerceSyncBanner />
        </aside>
      </div>
    </div>
  );
}

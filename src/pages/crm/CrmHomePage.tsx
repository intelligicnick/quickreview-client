import { Link } from 'react-router-dom';
import { CustomerCard } from '../../components/crm/CustomerCard';
import { DocCard } from '../../components/crm/DocCard';
import { StatPill } from '../../components/crm/StatPill';
import { formatInr, isToday, pendingAmount } from '../../lib/crm/format';
import { crmPath } from '../../lib/crm/paths';
import { useCrm } from '../../lib/crm/context';

export function CrmHomePage() {
  const { state, customerById, logCall, convertQuotationToInvoice } = useCrm();
  const customers = state.customers.length;
  const quotes = state.quotations.filter((q) => q.documentType === 'quotation');
  const invoices = state.quotations.filter((q) => q.documentType === 'invoice');
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const openQuotesValue = quotes.reduce((sum, q) => sum + q.total, 0);
  const unpaidInvoiceTotal = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);
  const salesPending = state.sales.reduce((sum, s) => sum + pendingAmount(s), 0);
  const dueToday = state.followUps.filter((f) => !f.completedAt && isToday(f.dueAt));

  const recentCustomers = state.customers.slice(0, 3);
  const recentQuotes = quotes.slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <StatPill label="Customers" value={customers} hint="Manage contacts" />
        <StatPill label="Quotations" value={quotes.length} hint="Awaiting response" />
        <StatPill label="Invoices" value={unpaidInvoices.length} hint="To collect" />
        <StatPill label="Open quotes" value={formatInr(openQuotesValue)} hint="Awaiting customer response" />
        <StatPill label="Unpaid invoices" value={formatInr(unpaidInvoiceTotal)} hint="To collect" />
        {salesPending > 0 ? (
          <StatPill label="Sales balance" value={formatInr(salesPending)} hint="Recorded sales not fully paid" />
        ) : null}
      </div>

      <section className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Link to={crmPath('customers/new')} className="btn-gradient w-full px-4 py-2.5 text-center text-sm sm:w-auto">+ Customer</Link>
        <Link to={crmPath('quotations/new')} className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-center text-sm font-semibold sm:w-auto">
          + Quotation
        </Link>
        <Link to={crmPath('invoices')} className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-center text-sm font-semibold sm:w-auto">
          Invoices
        </Link>
      </section>

      {recentQuotes.length > 0 ? (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Recent quotations</h2>
            <Link to={crmPath('quotations')} className="text-sm font-semibold text-brand">All</Link>
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

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Customers</h2>
          <Link to={crmPath('customers')} className="text-sm font-semibold text-brand">All</Link>
        </div>
        <ul className="mt-3 space-y-3">
          {recentCustomers.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
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

      {dueToday.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Follow-ups today</h2>
          <Link to={crmPath('follow-ups')} className="mt-2 block text-sm font-semibold text-brand">
            {dueToday.length} due — open follow-ups
          </Link>
        </section>
      ) : null}
    </div>
  );
}

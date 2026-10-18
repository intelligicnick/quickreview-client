import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/crm/EmptyState';
import { formatInr, formatShortDate, pendingAmount } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';

const ROW =
  'gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_6.5rem_5.5rem_5rem_auto] sm:items-center';

export function CrmInvoicesPage() {
  const { state, customerById, markInvoicePaid } = useCrm();
  const invoices = state.quotations.filter((q) => q.documentType === 'invoice');
  const unpaid = invoices.filter((i) => i.status !== 'paid');
  const pendingTotal = state.sales.reduce((sum, s) => sum + pendingAmount(s), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm">
        <span className="font-semibold text-amber-950">Pending collection: </span>
        <span className="font-display font-bold text-amber-950">{formatInr(pendingTotal)}</span>
        <span className="text-amber-800"> · {unpaid.length} unpaid invoice{unpaid.length === 1 ? '' : 's'}</span>
      </div>
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Convert an accepted quotation to an invoice, or create a sale from a customer profile."
          action={
            <Link to="/app/quickcrm/quotations" className="btn-gradient w-full">View quotations</Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="hidden gap-3 border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_6.5rem_5.5rem_5rem_auto]">
            <span>Invoice</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Actions</span>
          </div>
          <ul>
            {invoices.map((doc) => {
              const customer = customerById(doc.customerId);
              if (!customer) return null;
              const paid = doc.status === 'paid';
              return (
                <li key={doc.id} className={ROW}>
                  <p className="font-semibold text-ink">{doc.number}</p>
                  <div className="min-w-0">
                    <Link
                      to={`/app/quickcrm/customers/${customer.id}`}
                      className="font-semibold text-ink hover:text-brand"
                    >
                      {customer.name}
                    </Link>
                    {customer.company ? <p className="truncate text-xs text-muted">{customer.company}</p> : null}
                  </div>
                  <p className="font-display font-bold tabular-nums">{formatInr(doc.total)}</p>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      paid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {paid ? 'Paid' : 'Unpaid'}
                  </span>
                  <p className="text-xs text-muted">{formatShortDate(doc.createdAt)}</p>
                  <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                    {!paid ? (
                      <button
                        type="button"
                        onClick={() => markInvoicePaid(doc.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Mark paid
                      </button>
                    ) : null}
                    <Link
                      to={`/app/quickcrm/customers/${customer.id}`}
                      className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

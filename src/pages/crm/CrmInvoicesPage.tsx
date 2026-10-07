import { Link } from 'react-router-dom';
import { DocCard } from '../../components/crm/DocCard';
import { EmptyState } from '../../components/crm/EmptyState';
import { formatInr, pendingAmount } from '../../lib/crm/format';
import { useCrm } from '../../lib/crm/context';

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
        <ul className="space-y-3">
          {invoices.map((doc) => {
            const customer = customerById(doc.customerId);
            if (!customer) return null;
            return (
              <li key={doc.id}>
                <DocCard
                  doc={doc}
                  customer={customer}
                  onMarkPaid={() => markInvoicePaid(doc.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

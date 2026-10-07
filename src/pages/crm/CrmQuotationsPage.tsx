import { Link } from 'react-router-dom';
import { DocCard } from '../../components/crm/DocCard';
import { EmptyState } from '../../components/crm/EmptyState';
import { useCrm } from '../../lib/crm/context';

export function CrmQuotationsPage() {
  const { state, customerById, convertQuotationToInvoice } = useCrm();
  const quotes = state.quotations.filter((q) => q.documentType === 'quotation');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{quotes.length} open quotations</p>
        <Link to="/app/quickcrm/quotations/new" className="btn-gradient px-4 py-2.5 text-sm">+ Quotation</Link>
      </div>
      {quotes.length === 0 ? (
        <EmptyState
          title="No quotations yet"
          description="Pick a customer and items from your Quick Commerce catalog to send a quote on WhatsApp."
          action={
            <Link to="/app/quickcrm/quotations/new" className="btn-gradient w-full">Create quotation</Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {quotes.map((doc) => {
            const customer = customerById(doc.customerId);
            if (!customer) return null;
            return (
              <li key={doc.id}>
                <DocCard
                  doc={doc}
                  customer={customer}
                  onConvert={() => convertQuotationToInvoice(doc.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

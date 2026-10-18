import { useMemo, useState } from 'react';
import { DocCard } from '../../components/crm/DocCard';
import { EmptyState } from '../../components/crm/EmptyState';
import { Segmented } from '../../components/ui/Segmented';
import { useCrm } from '../../lib/crm/context';

type QuoteFilter = 'open' | 'accepted' | 'cancelled' | 'all';

export function CrmQuotationsPage() {
  const { state, customerById, convertQuotationToInvoice } = useCrm();
  const [filter, setFilter] = useState<QuoteFilter>('open');
  const quotes = state.quotations.filter((q) => q.documentType === 'quotation');

  const filtered = useMemo(() => {
    if (filter === 'all') return quotes;
    if (filter === 'open') return quotes.filter((q) => q.status === 'sent' || q.status === 'draft');
    if (filter === 'accepted') return quotes.filter((q) => q.status === 'accepted');
    return quotes.filter((q) => q.status === 'cancelled');
  }, [filter, quotes]);

  const openCount = quotes.filter((q) => q.status === 'sent' || q.status === 'draft').length;
  const acceptedCount = quotes.filter((q) => q.status === 'accepted').length;
  const declinedCount = quotes.filter((q) => q.status === 'cancelled').length;

  return (
    <div className="space-y-4">
      <Segmented
        aria-label="Quotation filter"
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'open', label: `Open · ${openCount}` },
          { id: 'accepted', label: `Accepted · ${acceptedCount}` },
          { id: 'cancelled', label: `Declined · ${declinedCount}` },
          { id: 'all', label: `All · ${quotes.length}` },
        ]}
      />
      <p className="text-xs text-muted">
        Prices sync from QuickCommerce — use Overview to sync catalogue.
      </p>
      {filtered.length === 0 ? (
        <EmptyState
          title="No quotations in this view"
          description="Create a quotation from the header actions or a customer profile."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((doc) => {
            const customer = customerById(doc.customerId);
            if (!customer) return null;
            return (
              <li key={doc.id}>
                <DocCard doc={doc} customer={customer} onConvert={() => convertQuotationToInvoice(doc.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

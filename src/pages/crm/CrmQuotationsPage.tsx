import { useMemo, useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { CrmAvatar } from '../../components/crm/CrmAvatar';
import { EmptyState } from '../../components/crm/EmptyState';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { formatInr, formatShortDate } from '../../lib/crm/format';
import { telHref, whatsAppHref } from '../../lib/crm/whatsapp';
import { useCrm } from '../../lib/crm/context';

type QuoteFilter = 'open' | 'accepted' | 'cancelled' | 'all';

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-50 text-brand-dark',
  accepted: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const ROW =
  'gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_6.5rem_5.5rem_5rem_auto] sm:items-center';

export function CrmQuotationsPage() {
  const { state, customerById, convertQuotationToInvoice, logCall, syncCommerce, commerceSyncing } = useCrm();
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
        Prices sync from QuickCommerce.{' '}
        <button
          type="button"
          disabled={commerceSyncing}
          className="font-semibold text-brand disabled:opacity-60"
          onClick={() => void syncCommerce()}
        >
          Sync now
        </button>
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="No quotations in this view"
          description="Create a quotation from the header actions or a customer profile."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <div className="hidden min-w-[680px] gap-3 border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_6.5rem_5.5rem_5rem_auto]">
            <span>Quotation</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Status</span>
            <span>Amount</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="min-w-[680px]">
            {filtered.map((doc) => {
              const customer = customerById(doc.customerId);
              if (!customer) return null;
              const title = doc.lines[0]?.name ?? 'Quotation';
              const statusLabel =
                doc.status === 'cancelled' ? 'Declined' : doc.status.charAt(0).toUpperCase() + doc.status.slice(1);
              return (
                <li key={doc.id} className={ROW}>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{doc.number}</p>
                    <p className="truncate text-xs text-muted">{title}</p>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <CrmAvatar name={customer.name} className="!h-8 !w-8 text-xs" />
                    <span className="truncate font-semibold">{customer.name}</span>
                  </div>
                  <p className="text-xs text-muted">{formatShortDate(doc.createdAt)}</p>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_CLASS[doc.status] ?? 'bg-slate-100'}`}
                  >
                    {statusLabel}
                  </span>
                  <p className="font-display font-bold tabular-nums">{formatInr(doc.total)}</p>
                  <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                    <a
                      href={telHref(customer.mobile)}
                      onClick={() => logCall(customer.id)}
                      className="inline-flex h-10 items-center gap-1 rounded-[10px] border border-line px-3 text-xs font-semibold"
                    >
                      <Phone className="h-4 w-4 stroke-[1.8]" aria-hidden />
                      Call
                    </a>
                    <a
                      href={whatsAppHref(
                        customer.mobile,
                        `Hi ${customer.name}, quotation ${doc.number} for ${formatInr(doc.total)}.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-1 rounded-[10px] border border-line px-3 text-xs font-semibold"
                    >
                      <MessageCircle className="h-4 w-4 stroke-[1.8]" aria-hidden />
                      WhatsApp
                    </a>
                    {(doc.status === 'sent' || doc.status === 'draft') && (
                      <Button type="button" variant="dark" size="sm" onClick={() => convertQuotationToInvoice(doc.id)}>
                        Convert to invoice
                      </Button>
                    )}
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

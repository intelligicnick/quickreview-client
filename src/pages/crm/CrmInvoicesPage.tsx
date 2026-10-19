import { Download, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CrmAvatar } from '../../components/crm/CrmAvatar';
import { EmptyState } from '../../components/crm/EmptyState';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { StatTile } from '../../components/ui/StatTile';
import { formatInr, formatShortDate, pendingAmount } from '../../lib/crm/format';
import { downloadInvoicePdf } from '../../lib/crm/invoice-pdf';
import { whatsAppHref } from '../../lib/crm/whatsapp';
import { useCrm } from '../../lib/crm/context';

const ROW =
  'gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_6.5rem_6.5rem_5.5rem_auto] sm:items-center';

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function CrmInvoicesPage() {
  const { state, customerById, markInvoicePaid, reopenInvoice } = useCrm();
  const invoices = state.quotations.filter((q) => q.documentType === 'invoice');
  const unpaid = invoices.filter((i) => i.status !== 'paid');
  const toCollect = unpaid.reduce((sum, i) => sum + i.total, 0);
  const collectedThisMonth = state.payments
    .filter((p) => isThisMonth(p.paidAt))
    .reduce((sum, p) => sum + p.amount, 0);
  const salesBalance = state.sales.reduce((sum, s) => sum + pendingAmount(s), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="To collect"
          value={formatInr(toCollect)}
          helper={`${unpaid.length} unpaid invoice${unpaid.length === 1 ? '' : 's'}`}
          accentClassName="text-orange"
        />
        <StatTile
          label="Collected"
          value={formatInr(collectedThisMonth)}
          helper="Marked paid this month"
          accentClassName="text-green-700"
        />
        <StatTile
          label="Sales balance"
          value={formatInr(salesBalance)}
          helper="Recorded sales not fully paid"
        />
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
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <div className="hidden min-w-[720px] gap-3 border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_6.5rem_6.5rem_5.5rem_auto]">
            <span>Invoice</span>
            <span>Customer</span>
            <span>Issued</span>
            <span>Status</span>
            <span>Amount</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="min-w-[720px]">
            {invoices.map((doc) => {
              const customer = customerById(doc.customerId);
              if (!customer) return null;
              const paid = doc.status === 'paid';
              const lineTitle = doc.lines[0]?.name ?? 'Invoice';
              const sourceQuote = doc.sourceQuotationId
                ? state.quotations.find((q) => q.id === doc.sourceQuotationId)
                : null;
              return (
                <li key={doc.id} className={ROW}>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{doc.number}</p>
                    <p className="truncate text-xs text-muted">
                      {lineTitle}
                      {sourceQuote ? ` · from ${sourceQuote.number}` : ''}
                    </p>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <CrmAvatar name={customer.name} className="!h-8 !w-8 text-xs" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{customer.name}</p>
                      {customer.company ? <p className="truncate text-xs text-muted">{customer.company}</p> : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted">{formatShortDate(doc.createdAt)}</p>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {paid ? 'Paid' : 'Sent · unpaid'}
                  </span>
                  <p className="font-display font-bold tabular-nums">{formatInr(doc.total)}</p>
                  <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end">
                    <a
                      href={whatsAppHref(
                        customer.mobile,
                        `Hi ${customer.name}, reminder for invoice ${doc.number} (${formatInr(doc.total)}).`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp ${customer.name}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-ink hover:bg-line-soft"
                    >
                      <MessageCircle className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
                    </a>
                    <IconButton
                      aria-label={`Download ${doc.number} PDF`}
                      onClick={() => downloadInvoicePdf(doc, customer)}
                    >
                      <Download className="h-[18px] w-[18px] stroke-[1.8]" />
                    </IconButton>
                    {paid ? (
                      <Button variant="secondary" size="sm" type="button" onClick={() => reopenInvoice(doc.id)}>
                        Undo
                      </Button>
                    ) : (
                      <Button size="sm" type="button" onClick={() => markInvoicePaid(doc.id)}>
                        Mark paid
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

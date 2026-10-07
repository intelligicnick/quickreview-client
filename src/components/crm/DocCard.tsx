import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContactActions } from './ContactActions';
import { formatInr, formatShortDate } from '../../lib/crm/format';
import type { Customer, DocStatus, Quotation } from '../../lib/crm/types';

const STATUS_LABEL: Record<DocStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const STATUS_CLASS: Record<DocStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-sky-100 text-sky-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-50 text-red-700',
};

type Props = {
  doc: Quotation;
  customer: Customer;
  onConvert?: () => void;
  onMarkPaid?: () => void;
};

export function DocCard({ doc, customer, onConvert, onMarkPaid }: Props) {
  const isQuote = doc.documentType === 'quotation';
  const linePreview = doc.lines.map((l) => l.name).slice(0, 2).join(', ');

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isQuote ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-800'}`}
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold text-ink">{doc.number}</p>
            <p className="font-semibold">{customer.name}</p>
            <p className="truncate text-sm text-muted">{linePreview}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[doc.status]}`}>
          {STATUS_LABEL[doc.status]}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-xl font-bold">{formatInr(doc.total)}</p>
        <p className="text-xs text-muted">{formatShortDate(doc.createdAt)}</p>
      </div>
      <div className="mt-3">
        <ContactActions
          mobile={customer.mobile}
          whatsAppMessage={`Hi ${customer.name}, ${isQuote ? 'quotation' : 'invoice'} ${doc.number} for ${formatInr(doc.total)}. Please confirm.`}
          compact
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to={`/app/quickcrm/customers/${customer.id}`}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line px-3 py-2.5 text-xs font-semibold"
        >
          Customer
        </Link>
        {isQuote && onConvert ? (
          <button type="button" onClick={onConvert} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white">
            → Invoice
          </button>
        ) : null}
        {!isQuote && doc.status !== 'paid' && onMarkPaid ? (
          <button
            type="button"
            onClick={onMarkPaid}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white"
          >
            Mark paid
          </button>
        ) : null}
      </div>
    </article>
  );
}

import { FileText, IndianRupee, MessageSquare, Plus, RefreshCw, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { crmPath } from '../../lib/crm/paths';

type Props = {
  open: boolean;
  onClose: () => void;
};

const ACTIONS = [
  { to: crmPath('customers/new'), label: 'Customer', icon: UserPlus },
  { to: crmPath('follow-ups/new'), label: 'Follow-up', icon: RefreshCw },
  { to: crmPath('sales/new'), label: 'Sale', icon: IndianRupee },
  { to: crmPath('payments/new'), label: 'Payment', icon: IndianRupee },
  { to: crmPath('notes/new'), label: 'Note', icon: MessageSquare },
  { to: crmPath('quotations/new'), label: 'Quotation', icon: FileText },
];

export function QuickAddFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label="Quick add"
      onClick={onOpen}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/35 lg:hidden"
    >
      <Plus className="h-7 w-7" />
    </button>
  );
}

export function QuickAddSheet({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-50 bg-ink/40" aria-label="Close" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl border-t border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Quick add</h2>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => (
            <li key={action.to}>
              <Link
                to={action.to}
                onClick={onClose}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink hover:bg-white"
              >
                <action.icon className="h-5 w-5 text-brand" />
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

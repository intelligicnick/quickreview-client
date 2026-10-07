import { RefreshCw, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCrm } from '../../lib/crm/context';
import { formatShortDate } from '../../lib/crm/format';

export function CommerceSyncBanner() {
  const { state, syncCommerce, commerceSyncing } = useCrm();
  const [message, setMessage] = useState<string | null>(null);
  const sync = state.commerceSync;

  async function runSync() {
    setMessage(null);
    const result = await syncCommerce();
    if (result.ok) {
      setMessage(`Synced ${result.added} new, ${result.updated} updated from Quick Commerce`);
    } else {
      setMessage(result.error ?? 'Could not sync');
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ShoppingBag className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Quick Commerce catalog</p>
          <p className="text-xs text-muted">
            {sync.itemCount > 0
              ? `${sync.itemCount} products/services · ${sync.lastSyncedAt ? `Updated ${formatShortDate(sync.lastSyncedAt)}` : 'Synced'}`
              : 'Sync prices & items for quotations and invoices'}
          </p>
          {message ? <p className="mt-1 text-xs font-medium text-brand-dark">{message}</p> : null}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={commerceSyncing}
          onClick={() => void runSync()}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60 sm:flex-none"
        >
          <RefreshCw className={`h-4 w-4 ${commerceSyncing ? 'animate-spin' : ''}`} />
          Sync now
        </button>
        <Link
          to="/app/quickcommerce"
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink"
        >
          Edit catalog
        </Link>
      </div>
    </div>
  );
}

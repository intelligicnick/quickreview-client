import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../../lib/api';

type ExistingCode = {
  id?: string;
  code: string;
  isMenuQr: boolean | null;
  isPrinted?: boolean;
};

type StockRow = {
  id: string;
  code: string;
};

type Props = {
  locationId: string;
  locationName: string;
  existingCodes: ExistingCode[];
  onAssigned: () => void;
};

function kindLabel(isMenuQr: boolean | null): string {
  if (isMenuQr === true) return 'Commerce';
  if (isMenuQr === false) return 'Review';
  return 'Revisit';
}

export function AssignStandeeQr({ locationId, locationName, existingCodes, onAssigned }: Props) {
  const hasPrintedStandee = useMemo(
    () => existingCodes.some((row) => row.isPrinted),
    [existingCodes],
  );

  const [stock, setStock] = useState<StockRow[]>([]);
  const [codeId, setCodeId] = useState('');
  const [kind, setKind] = useState<'review' | 'menu'>('review');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasPrintedStandee) return;
    void (async () => {
      try {
        const data = await api<StockRow[]>('/api/admin/qr-codes?unassigned=true&printed=true');
        setStock(data);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load QR stock');
      }
    })();
  }, [hasPrintedStandee, locationId]);

  async function assign() {
    if (!codeId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/qr-codes/${codeId}/assign`, {
        method: 'POST',
        body: { locationId, kind },
      });
      setCodeId('');
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign standee');
    } finally {
      setBusy(false);
    }
  }

  if (hasPrintedStandee) {
    return (
      <div className="mt-3 rounded-xl border border-line bg-paper px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Physical standee</p>
        <ul className="mt-1 space-y-1 text-sm">
          {existingCodes.map((row) => (
            <li key={row.id ?? row.code}>
              <span className="font-mono font-semibold">{row.code}</span>
              <span className="text-muted"> · {kindLabel(row.isMenuQr)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-line bg-paper px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Assign printed standee</p>
      <p className="mt-0.5 text-xs text-muted">Spot registration for {locationName}</p>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <select
          value={codeId}
          onChange={(e) => setCodeId(e.target.value)}
          className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="">Select code</option>
          {stock.map((row) => (
            <option key={row.id} value={row.id}>
              {row.code}
            </option>
          ))}
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as 'review' | 'menu')}
          className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="review">Review QR</option>
          <option value="menu">Commerce QR</option>
        </select>
        <button
          type="button"
          disabled={busy || !codeId}
          onClick={() => void assign()}
          className="min-h-10 rounded-xl bg-ink px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Assign standee
        </button>
      </div>
      {stock.length === 0 && !error ? (
        <p className="mt-2 text-xs text-muted">No printed unassigned codes in stock.</p>
      ) : null}
    </div>
  );
}

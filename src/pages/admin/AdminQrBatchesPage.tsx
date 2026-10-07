import { useEffect, useState } from 'react';
import { QrCodePreview } from '../../components/QrCodePreview';
import { api, ApiError } from '../../lib/api';

type QrRow = {
  id: string;
  code: string;
  batchId: string;
  claimUrl: string;
  locationId: string | null;
  targetUrl: string | null;
  isMenuQr: boolean | null;
  isPrinted: boolean;
};

export function AdminQrBatchesPage() {
  const [rows, setRows] = useState<QrRow[]>([]);
  const [batchSize, setBatchSize] = useState(20);
  const [lastBatch, setLastBatch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assign, setAssign] = useState({ codeId: '', locationId: '', kind: 'review' as 'review' | 'menu' });

  async function load(batchId?: string) {
    const suffix = batchId ? `?batchId=${encodeURIComponent(batchId)}` : '?unassigned=true';
    const data = await api<QrRow[]>(`/api/admin/qr-codes${suffix}`);
    setRows(data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load QR codes'));
  }, []);

  async function createBatch() {
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ batchId: string }>('/api/admin/qr-codes/batches', {
        method: 'POST',
        body: { size: batchSize },
      });
      setLastBatch(created.batchId);
      await load(created.batchId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create batch');
    } finally {
      setBusy(false);
    }
  }

  async function assignCode() {
    if (!assign.codeId || !assign.locationId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/qr-codes/${assign.codeId}/assign`, {
        method: 'POST',
        body: { locationId: assign.locationId, kind: assign.kind },
      });
      setAssign({ codeId: '', locationId: '', kind: 'review' });
      await load(lastBatch ?? undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign code');
    } finally {
      setBusy(false);
    }
  }

  async function togglePrinted(row: QrRow) {
    setBusy(true);
    try {
      await api(`/api/admin/qr-codes/${row.id}/printed`, {
        method: 'PATCH',
        body: { isPrinted: !row.isPrinted },
      });
      await load(lastBatch ?? undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update print flag');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">QR batches</h1>
      <p className="mt-1 text-sm text-muted">Pre-print claim URLs, then assign Review or Commerce QR to a location.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-5">
        <label className="text-sm">
          <span className="font-semibold">Batch size</span>
          <input
            type="number"
            min={1}
            max={200}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="mt-1 min-h-11 w-28 rounded-xl border border-line px-3"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createBatch()}
          className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Generate batch
        </button>
        {lastBatch ? <p className="text-sm text-muted">Latest batch: <span className="font-mono">{lastBatch}</span></p> : null}
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Assign code</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select
            value={assign.codeId}
            onChange={(e) => setAssign((v) => ({ ...v, codeId: e.target.value }))}
            className="min-h-11 rounded-xl border border-line px-3 text-sm"
          >
            <option value="">Select code</option>
            {rows.filter((r) => !r.locationId).map((row) => (
              <option key={row.id} value={row.id}>{row.code}</option>
            ))}
          </select>
          <input
            value={assign.locationId}
            onChange={(e) => setAssign((v) => ({ ...v, locationId: e.target.value }))}
            placeholder="Location ID"
            className="min-h-11 rounded-xl border border-line px-3 text-sm"
          />
          <select
            value={assign.kind}
            onChange={(e) => setAssign((v) => ({ ...v, kind: e.target.value as 'review' | 'menu' }))}
            className="min-h-11 rounded-xl border border-line px-3 text-sm"
          >
            <option value="review">Review QR</option>
            <option value="menu">Commerce QR</option>
          </select>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void assignCode()}
          className="mt-3 min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Assign
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className="flex flex-col rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-col items-center text-center">
              <QrCodePreview value={row.claimUrl} label={`Claim QR for ${row.code}`} size={120} />
              <p className="mt-3 font-mono font-semibold">{row.code}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {row.locationId ? (row.isMenuQr ? 'Menu' : 'Review') : 'Unassigned'}
                {row.isPrinted ? ' · Printed' : ''}
              </p>
            </div>
            <p className="mt-3 break-all text-center text-xs text-muted">{row.claimUrl}</p>
            {row.targetUrl && row.locationId ? (
              <p className="mt-1 break-all text-center text-xs text-muted">→ {row.targetUrl}</p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void togglePrinted(row)}
              className="mt-4 min-h-10 w-full rounded-xl border border-line px-3 text-sm font-semibold disabled:opacity-50"
            >
              {row.isPrinted ? 'Mark not printed' : 'Mark printed'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { LocationPicker } from '../../components/admin/LocationPicker';
import { QrCodePreview } from '../../components/QrCodePreview';
import { api, ApiError } from '../../lib/api';
import { downloadQrPrintSheetPdf } from '../../lib/qr-print-sheet-pdf';

function qrEncodeValue(row: QrRow): string {
  return row.targetUrl ?? row.claimUrl;
}

type QrRow = {
  id: string;
  code: string;
  batchId: string;
  claimUrl: string;
  locationId: string | null;
  locationName: string | null;
  targetUrl: string | null;
  isMenuQr: boolean | null;
  isPrinted: boolean;
  createdAt: string;
};

type Filter = 'all' | 'unassigned' | 'not_printed' | 'assigned' | 'printed' | 'merchant_side';

export function AdminQrBatchesPage() {
  const [rows, setRows] = useState<QrRow[]>([]);
  const [batchSize, setBatchSize] = useState(20);
  const [lastBatch, setLastBatch] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assign, setAssign] = useState({ codeId: '', locationId: '', kind: 'review' as 'review' | 'menu' });

  async function loadAll(merchantDigital = false) {
    const path = merchantDigital ? '/api/admin/qr-codes?merchantDigital=true' : '/api/admin/qr-codes';
    const data = await api<QrRow[]>(path);
    setRows(data);
  }

  useEffect(() => {
    const merchantDigital = filter === 'merchant_side';
    void loadAll(merchantDigital).catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Could not load QR codes'),
    );
  }, [filter]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filter === 'unassigned') return !row.locationId && row.isPrinted;
      if (filter === 'not_printed') return !row.isPrinted;
      if (filter === 'assigned') return Boolean(row.locationId);
      if (filter === 'printed') return row.isPrinted && !row.locationId;
      if (filter === 'merchant_side') return true;
      return true;
    });
  }, [rows, filter]);

  const stats = useMemo(() => {
    const ready = rows.filter((r) => r.isPrinted && !r.locationId).length;
    const notPrinted = rows.filter((r) => !r.isPrinted).length;
    const assigned = rows.filter((r) => r.locationId).length;
    return { ready, notPrinted, assigned };
  }, [rows]);

  async function createBatch() {
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ batchId: string }>('/api/admin/qr-codes/batches', {
        method: 'POST',
        body: { size: batchSize },
      });
      setLastBatch(created.batchId);
      await loadAll(filter === 'merchant_side');
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
      await loadAll(filter === 'merchant_side');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign code');
    } finally {
      setBusy(false);
    }
  }

  async function bulkPrinted(printed: boolean) {
    const targets = filtered.filter((row) => row.isPrinted !== printed);
    if (!targets.length) return;
    setBusy(true);
    try {
      for (const row of targets.slice(0, 40)) {
        await api(`/api/admin/qr-codes/${row.id}/printed`, { method: 'PATCH', body: { isPrinted: printed } });
      }
      await loadAll(filter === 'merchant_side');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bulk update failed');
    } finally {
      setBusy(false);
    }
  }

  async function downloadPrintSheet() {
    const batch = lastBatch ?? filtered[0]?.batchId;
    const sheet = batch ? filtered.filter((r) => r.batchId === batch) : filtered;
    if (!sheet.length) {
      setError('No QR codes in the current selection to print.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await downloadQrPrintSheetPdf(
        sheet.map((r) => ({ code: r.code, link: qrEncodeValue(r) })),
        `qr-batch-${batch ?? 'export'}.pdf`,
      );
    } catch {
      setError('Could not generate print sheet PDF.');
    } finally {
      setBusy(false);
    }
  }

  function opensLabel(row: QrRow) {
    if (!row.locationId) return '—';
    if (row.isMenuQr) return 'Commerce';
    if (row.isMenuQr === false) return 'Review';
    return '—';
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">QR stock</h1>
      <p className="mt-1 text-sm text-muted">Print batches, assign when you ship hardware, filter by status.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Ready to ship" value={stats.ready} hint="printed, unassigned" />
        <Stat label="Not printed yet" value={stats.notPrinted} hint="in latest batches" />
        <Stat label="Assigned" value={stats.assigned} hint="live at merchants" />
      </div>

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
          New batch
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => bulkPrinted(true)}
          className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold disabled:opacity-50"
        >
          Mark filtered printed
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void downloadPrintSheet()}
          className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? 'Building PDF…' : 'Download print sheet (PDF)'}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold">Assign code</h2>
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          <select
            value={assign.codeId}
            onChange={(e) => setAssign((v) => ({ ...v, codeId: e.target.value }))}
            className="min-h-11 rounded-xl border border-line px-3 text-sm"
          >
            <option value="">Select code</option>
            {rows.filter((r) => !r.locationId && r.isPrinted).map((row) => (
              <option key={row.id} value={row.id}>{row.code}</option>
            ))}
          </select>
          <LocationPicker value={assign.locationId} onChange={(id) => setAssign((v) => ({ ...v, locationId: id }))} />
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
          Assign to merchant
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['all', 'All'],
            ['unassigned', 'Unassigned'],
            ['not_printed', 'Not printed'],
            ['printed', 'Printed'],
            ['assigned', 'Assigned'],
            ['merchant_side', 'Merchant-side QR'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              filter === id ? 'bg-ink text-white' : 'bg-white text-muted ring-1 ring-line'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row) => {
          const qrValue = qrEncodeValue(row);
          const status = row.locationId ? 'Assigned' : row.isPrinted ? 'Printed' : 'Not printed';
          return (
            <article
              key={row.id}
              className="flex flex-col rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <QrCodePreview value={qrValue} size={88} label={`QR ${row.code}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold">{row.code}</p>
                  <p className="mt-1 break-all text-xs text-muted">{qrValue}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Status</dt>
                  <dd className="mt-0.5 text-muted">{status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Opens</dt>
                  <dd className="mt-0.5">{opensLabel(row)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Assigned to</dt>
                  <dd className="mt-0.5">{row.locationName ?? '—'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

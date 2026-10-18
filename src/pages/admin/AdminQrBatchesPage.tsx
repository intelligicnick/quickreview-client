import { useEffect, useMemo, useState } from 'react';
import { LocationPicker } from '../../components/admin/LocationPicker';
import { AdminQrStockCard, type QrStockRow } from '../../components/admin/AdminQrStockCard';
import { PageHeader } from '../../components/admin/PageHeader';
import { Modal } from '../../components/admin/ui/Modal';
import { api, ApiError } from '../../lib/api';
import { downloadQrPrintSheetPdf } from '../../lib/qr-print-sheet-pdf';

type Filter = 'all' | 'unassigned' | 'not_printed' | 'assigned' | 'printed' | 'merchant_side';

const PAGE_SIZE = 24;

function qrEncodeValue(row: QrStockRow): string {
  return row.targetUrl ?? row.claimUrl;
}

export function AdminQrBatchesPage() {
  const [rows, setRows] = useState<QrStockRow[]>([]);
  const [batchSize, setBatchSize] = useState(20);
  const [lastBatch, setLastBatch] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignRow, setAssignRow] = useState<QrStockRow | null>(null);
  const [assign, setAssign] = useState({ locationId: '', kind: 'review' as 'review' | 'menu' });

  async function loadAll(merchantDigital = false) {
    const path = merchantDigital ? '/api/admin/qr-codes?merchantDigital=true' : '/api/admin/qr-codes';
    const data = await api<QrStockRow[]>(path);
    setRows(data);
  }

  useEffect(() => {
    const merchantDigital = filter === 'merchant_side';
    void loadAll(merchantDigital).catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Could not load QR codes'),
    );
  }, [filter]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === 'unassigned' && (!row.isPrinted || row.locationId)) return false;
      if (filter === 'not_printed' && row.isPrinted) return false;
      if (filter === 'assigned' && !row.locationId) return false;
      if (filter === 'printed' && (!row.isPrinted || row.locationId)) return false;
      if (needle && !row.code.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, filter, search]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stats = useMemo(() => {
    const ready = rows.filter((r) => r.isPrinted && !r.locationId).length;
    const notPrinted = rows.filter((r) => !r.isPrinted).length;
    const assigned = rows.filter((r) => r.locationId).length;
    const waiting = rows.filter((r) => r.isPrinted && !r.locationId).length;
    return { ready, notPrinted, assigned, waiting };
  }, [rows]);

  const filterCounts = useMemo(
    () => ({
      all: rows.length,
      unassigned: rows.filter((r) => !r.locationId && r.isPrinted).length,
      not_printed: rows.filter((r) => !r.isPrinted).length,
      printed: rows.filter((r) => r.isPrinted && !r.locationId).length,
      assigned: rows.filter((r) => r.locationId).length,
      merchant_side: filter === 'merchant_side' ? rows.length : 0,
    }),
    [rows, filter],
  );

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
    if (!assignRow || !assign.locationId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/qr-codes/${assignRow.id}/assign`, {
        method: 'POST',
        body: { locationId: assign.locationId, kind: assign.kind },
      });
      setAssignRow(null);
      setAssign({ locationId: '', kind: 'review' });
      await loadAll(filter === 'merchant_side');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign code');
    } finally {
      setBusy(false);
    }
  }

  async function bulkPrinted() {
    const targets = rows.filter((r) => selected.has(r.id) && !r.isPrinted);
    if (!targets.length) return;
    setBusy(true);
    try {
      for (const row of targets.slice(0, 40)) {
        await api(`/api/admin/qr-codes/${row.id}/printed`, { method: 'PATCH', body: { isPrinted: true } });
      }
      setSelected(new Set());
      await loadAll(filter === 'merchant_side');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bulk update failed');
    } finally {
      setBusy(false);
    }
  }

  async function downloadPrintSheet(codes: QrStockRow[]) {
    const batch = lastBatch ?? codes[0]?.batchId;
    const sheet = batch ? codes.filter((r) => r.batchId === batch) : codes;
    if (!sheet.length) {
      setError('No QR codes in the current selection to print.');
      return;
    }
    setBusy(true);
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

  function downloadPng(row: QrStockRow) {
    const svg = document.querySelector(`[data-qr-id="${row.id}"] svg`);
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgUrl = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size + 80;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = '#101828';
      ctx.font = 'bold 48px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(row.code, size / 2, size + 56);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${row.code}.png`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }

  return (
    <div>
      <PageHeader
        title="QR stock"
        subtitle="Print batches, assign when you ship hardware."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="admin-label">Batch size</span>
              <input
                type="number"
                min={1}
                max={200}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="admin-ctl admin-ctl-form mt-1 w-20 px-2 text-sm"
              />
            </label>
            <button type="button" disabled={busy} onClick={() => void downloadPrintSheet(filtered)} className="admin-btn-secondary text-sm">
              Download print sheet
            </button>
            <button type="button" disabled={busy} onClick={() => void createBatch()} className="admin-btn-primary text-sm">
              New batch
            </button>
          </div>
        }
      />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ready to ship" value={stats.ready} />
        <Stat label="Not printed" value={stats.notPrinted} />
        <Stat label="Live at merchants" value={stats.assigned} />
        <Stat label="Orders waiting for a code" value={stats.waiting} href="/admin/qr?filter=unassigned" />
      </div>

      <section className="admin-card p-4">
        <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['all', 'All'],
                ['unassigned', 'Unassigned'],
                ['not_printed', 'Not printed'],
                ['printed', 'Printed'],
                ['assigned', 'Assigned'],
                ['merchant_side', 'Merchant-side'],
              ] as [Filter, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFilter(id);
                  setPage(0);
                }}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  filter === id ? 'bg-[var(--admin-brand-soft)] text-[var(--admin-brand)]' : 'text-[var(--admin-muted)]'
                }`}
              >
                {label} ({filterCounts[id]})
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by code"
            className="admin-ctl admin-ctl-form w-full max-w-xs px-3 text-sm lg:w-48"
          />
        </div>

        <div
          className="mt-4 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))' }}
        >
          {pageRows.map((row) => (
            <div key={row.id} data-qr-id={row.id}>
              <AdminQrStockCard
                row={row}
                selected={selected.has(row.id)}
                onSelect={(checked) => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(row.id);
                    else next.delete(row.id);
                    return next;
                  });
                }}
                onAssign={() => {
                  setAssignRow(row);
                  setAssign({ locationId: '', kind: 'review' });
                }}
                onCopy={() => void navigator.clipboard.writeText(qrEncodeValue(row))}
                onPng={() => downloadPng(row)}
              />
            </div>
          ))}
        </div>

        {pageCount > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="admin-btn-secondary"
            >
              Previous
            </button>
            <span className="text-[var(--admin-muted)]">Page {page + 1} of {pageCount}</span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              className="admin-btn-secondary"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {selected.size > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">{selected.size} selected</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => void bulkPrinted()} className="admin-btn-primary text-sm">
                Mark printed
              </button>
              <button
                type="button"
                onClick={() => void downloadPrintSheet(rows.filter((r) => selected.has(r.id)))}
                className="admin-btn-secondary text-sm"
              >
                Download print sheet
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="admin-btn-secondary text-sm">
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal open={Boolean(assignRow)} title="Assign QR code" onClose={() => setAssignRow(null)}>
        <p className="admin-meta mb-3 text-sm">Code <span className="font-mono-admin font-semibold">{assignRow?.code}</span></p>
        <LocationPicker value={assign.locationId} onChange={(id) => setAssign((v) => ({ ...v, locationId: id }))} />
        <select
          value={assign.kind}
          onChange={(e) => setAssign((v) => ({ ...v, kind: e.target.value as 'review' | 'menu' }))}
          className="admin-ctl admin-ctl-form mt-2 w-full px-3 text-sm"
        >
          <option value="review">Review page</option>
          <option value="menu">Menu</option>
        </select>
        <button type="button" disabled={busy} onClick={() => void assignCode()} className="admin-btn-primary mt-4">
          Assign to location
        </button>
      </Modal>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="admin-card p-4">
      <p className="admin-label uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block hover:opacity-90">
        {inner}
      </a>
    );
  }
  return inner;
}

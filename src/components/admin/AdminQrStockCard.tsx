import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';

export type QrStockRow = {
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

function encodeValue(row: QrStockRow): string {
  return row.targetUrl ?? row.claimUrl;
}

function shortUrl(row: QrStockRow): string {
  const full = encodeValue(row);
  try {
    const u = new URL(full);
    return `${u.host}${u.pathname}`;
  } catch {
    return full;
  }
}

function opensLabel(row: QrStockRow): string {
  if (!row.locationId) return 'Not set';
  if (row.isMenuQr) return 'Menu';
  if (row.isMenuQr === false) return 'Review page';
  return 'Not set';
}

function statusPill(row: QrStockRow): { label: string; className: string; border?: string } {
  if (row.locationId) {
    return {
      label: 'Assigned',
      className: 'bg-[#eef4ff] text-[#3538cd]',
      border: 'border-[#c7d7fe]',
    };
  }
  if (row.isPrinted) {
    return { label: 'Ready to ship', className: 'admin-pill-success' };
  }
  return { label: 'Not printed', className: 'bg-[var(--admin-border-soft)] text-[var(--admin-muted)]' };
}

type Props = {
  row: QrStockRow;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onAssign: () => void;
  onCopy: () => void;
  onPng: () => void;
  scanCount?: number;
};

export function AdminQrStockCard({
  row,
  selected,
  onSelect,
  onAssign,
  onCopy,
  onPng,
  scanCount = 0,
}: Props) {
  const value = encodeValue(row);
  const status = statusPill(row);
  const batchShort = row.batchId.slice(0, 8);

  return (
    <article
      className={`flex flex-col rounded-[var(--admin-radius-card)] border bg-[var(--admin-surface)] p-4 ${
        status.border ? `border-2 ${status.border}` : 'border-[var(--admin-border)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-muted)]">
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
          Select
        </label>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>

      <div className="relative mx-auto mt-3 rounded-[var(--admin-radius-ctl)] border border-[var(--admin-border)] bg-white p-3">
        <QRCode value={value} size={148} level="H" bgColor="#ffffff" fgColor="#101828" />
        <img
          src="/brand/quickreview-icon.png"
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white object-contain"
        />
      </div>

      <p className="font-mono-admin mt-3 text-center text-[20px] font-semibold tracking-[0.12em]">{row.code}</p>
      <p className="mt-1 truncate text-center text-xs text-[var(--admin-muted)]" title={shortUrl(row)}>
        {shortUrl(row)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="admin-label">Opens</dt>
          <dd>{opensLabel(row)}</dd>
        </div>
        <div>
          <dt className="admin-label">Scans</dt>
          <dd>{scanCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="admin-label">Assigned to</dt>
          <dd>
            {row.locationId ? (
              <Link to="/admin/locations" className="font-semibold text-[var(--admin-brand)]">
                {row.locationName}
              </Link>
            ) : (
              <span className="text-[var(--admin-muted)]">Unassigned</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="admin-label">Batch</dt>
          <dd className="font-mono-admin text-xs">{batchShort}</dd>
        </div>
        <div>
          <dt className="admin-label">Printed</dt>
          <dd className="text-xs">{row.isPrinted ? 'Yes' : '—'}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {row.locationId ? (
          <Link to="/admin/locations" className="admin-btn-secondary flex-1 text-center text-sm">
            View location
          </Link>
        ) : (
          <button type="button" onClick={onAssign} className="admin-btn-primary flex-1 text-sm">
            Assign
          </button>
        )}
        <button type="button" onClick={onPng} className="admin-btn-secondary text-sm">PNG</button>
        <button type="button" onClick={onCopy} className="admin-btn-secondary text-sm">Copy link</button>
      </div>
    </article>
  );
}

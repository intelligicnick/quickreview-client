import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/admin/PageHeader';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/admin-ui';

type Row = { id: string; action: string; summary: string; createdAt: string };

type Filter = 'all' | 'comps' | 'impersonation' | 'payments' | 'qr' | 'account';

function matchesFilter(row: Row, filter: Filter): boolean {
  if (filter === 'all') return true;
  const text = `${row.action} ${row.summary}`.toLowerCase();
  if (filter === 'comps') return text.includes('comp');
  if (filter === 'impersonation') return text.includes('panel') || text.includes('login');
  if (filter === 'payments') return text.includes('payment');
  if (filter === 'qr') return text.includes('qr');
  if (filter === 'account') return text.includes('user') || text.includes('account');
  return true;
}

function groupRows(rows: Row[]): { id: string; summary: string; createdAt: string; count: number }[] {
  const out: { id: string; summary: string; createdAt: string; count: number }[] = [];
  for (const row of rows) {
    const prev = out[out.length - 1];
    if (prev && prev.summary === row.summary) {
      prev.count += 1;
      prev.createdAt = row.createdAt;
    } else {
      out.push({ id: row.id, summary: row.summary, createdAt: row.createdAt, count: 1 });
    }
  }
  return out.map((row) => ({
    ...row,
    summary: row.count > 1 ? `${row.summary} × ${row.count}` : row.summary,
  }));
}

export function AdminActivityPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [hidePanelOpens, setHidePanelOpens] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Row[]>('/api/admin/activity'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load activity');
      }
    })();
  }, []);

  const visible = useMemo(() => {
    let list = rows.filter((r) => matchesFilter(r, filter));
    if (hidePanelOpens) list = list.filter((r) => !/opened panel/i.test(r.summary));
    return groupRows(list);
  }, [rows, filter, hidePanelOpens]);

  return (
    <div>
      <PageHeader title="Activity log" subtitle="Comps, impersonations, payment approvals, and QR batches." />
      {error ? (
        <p className="mb-4 rounded-[var(--admin-radius-ctl)] bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
          {error}
        </p>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="admin-ctl admin-ctl-form px-3 text-sm"
        >
          <option value="all">All types</option>
          <option value="comps">Comps</option>
          <option value="impersonation">Impersonation</option>
          <option value="payments">Payments</option>
          <option value="qr">QR</option>
          <option value="account">Account</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
          <input type="checkbox" checked={hidePanelOpens} onChange={(e) => setHidePanelOpens(e.target.checked)} />
          Hide panel opens
        </label>
      </div>
      <section className="admin-card admin-table-scroll p-4">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--admin-border)] text-xs font-semibold uppercase text-[var(--admin-muted)]">
              <th className="py-2 pr-3">Action</th>
              <th className="py-2 pr-3">Target</th>
              <th className="py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-[var(--admin-border-soft)]">
                <td className="py-3 pr-3">{row.summary}</td>
                <td className="py-3 pr-3 text-[var(--admin-muted)]">—</td>
                <td className="py-3 text-[var(--admin-muted)]">{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && !error ? <p className="admin-meta mt-4 text-sm">Nothing logged yet.</p> : null}
      </section>
    </div>
  );
}

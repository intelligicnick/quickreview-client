import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { adminWhen } from '../../lib/admin-ui';

type Row = { id: string; action: string; summary: string; createdAt: string };

export function AdminActivityPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Row[]>('/api/admin/activity'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load activity');
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Activity log</h1>
      <p className="mt-1 text-sm text-muted">Comps, impersonations, payment approvals, and QR batches.</p>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {rows.length === 0 && !error ? <p className="mt-6 text-sm text-muted">Nothing logged yet.</p> : null}
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4">
            <p className="text-sm">{row.summary}</p>
            <span className="shrink-0 text-xs text-muted">{adminWhen(row.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

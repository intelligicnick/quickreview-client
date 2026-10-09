import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  handledAt: string | null;
  createdAt: string;
};

export function AdminContactPage() {
  const [rows, setRows] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(true);

  async function load() {
    const suffix = openOnly ? '?open=true' : '';
    const data = await api<Message[]>(`/api/admin/contact-messages${suffix}`);
    setRows(data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load messages'));
  }, [openOnly]);

  async function markHandled(id: string) {
    try {
      await api(`/api/admin/contact-messages/${id}/handled`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update message');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Support inbox</h1>
      <p className="mt-1 text-sm text-muted">Messages from the site contact form.</p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
        Open only
      </label>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">{row.name} · {row.email}</p>
            {row.phone ? <p className="text-sm text-muted">{row.phone}</p> : null}
            <p className="mt-2 text-sm">{row.message}</p>
            <p className="mt-2 text-xs text-muted">{new Date(row.createdAt).toLocaleString()}</p>
            {!row.handledAt ? (
              <button
                type="button"
                onClick={() => void markHandled(row.id)}
                className="mt-3 min-h-10 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
              >
                Mark handled
              </button>
            ) : (
              <p className="mt-2 text-xs font-semibold text-muted">Handled</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

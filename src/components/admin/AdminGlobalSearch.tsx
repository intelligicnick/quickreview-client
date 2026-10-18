import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Modal } from './ui/Modal';

type Hit =
  | { type: 'merchant'; id: string; label: string; meta: string; href: string }
  | { type: 'location'; id: string; label: string; meta: string; href: string }
  | { type: 'qr'; id: string; label: string; meta: string; href: string }
  | { type: 'utr'; id: string; label: string; meta: string; href: string };

export function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    const needle = term.trim();
    if (needle.length < 2) {
      setHits([]);
      return;
    }
    setBusy(true);
    try {
      const [users, locations, payments, qrCodes] = await Promise.all([
        api<{ id: string; name: string; email: string }[]>(`/api/admin/users?q=${encodeURIComponent(needle)}`),
        api<{ id: string; name: string; business: { name: string } }[]>(
          `/api/admin/locations?q=${encodeURIComponent(needle)}`,
        ),
        api<{ id: string; referenceNote: string | null; amountInr: number; userEmail: string | null }[]>(
          '/api/admin/payments',
        ),
        api<{ id: string; code: string; locationName: string | null }[]>('/api/admin/qr-codes'),
      ]);
      const lower = needle.toLowerCase();
      const next: Hit[] = [];
      for (const u of users.slice(0, 6)) {
        next.push({
          type: 'merchant',
          id: u.id,
          label: u.name,
          meta: u.email,
          href: `/admin/merchants/${u.id}`,
        });
      }
      for (const loc of locations.slice(0, 6)) {
        next.push({
          type: 'location',
          id: loc.id,
          label: loc.name,
          meta: loc.business.name,
          href: `/admin/locations`,
        });
      }
      for (const row of qrCodes.filter((r) => r.code.toLowerCase().includes(lower)).slice(0, 6)) {
        next.push({
          type: 'qr',
          id: row.id,
          label: row.code,
          meta: row.locationName ?? 'Unassigned',
          href: '/admin/qr',
        });
      }
      for (const pay of payments.filter((p) => p.referenceNote?.includes(needle)).slice(0, 4)) {
        next.push({
          type: 'utr',
          id: pay.id,
          label: pay.referenceNote ?? needle,
          meta: `${pay.userEmail ?? '—'} · ₹${pay.amountInr}`,
          href: `/admin/payments?payment=${pay.id}`,
        });
      }
      setHits(next);
    } catch {
      setHits([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void runSearch(q), 200);
    return () => window.clearTimeout(timer);
  }, [q, open, runSearch]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn-secondary hidden min-w-[200px] justify-between gap-2 px-3 text-left lg:inline-flex"
      >
        <span className="flex items-center gap-2 text-[var(--admin-muted)]">
          <Search className="h-4 w-4" />
          Search…
        </span>
        <kbd className="rounded border border-[var(--admin-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--admin-subtle)]">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="admin-btn-secondary inline-flex h-9 w-9 p-0 lg:hidden"
      >
        <Search className="h-4 w-4" />
      </button>
      <Modal open={open} title="Search" onClose={() => setOpen(false)} wide>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Merchants, locations, QR codes, UTRs…"
          className="admin-ctl admin-ctl-form w-full px-3 text-sm outline-none ring-[var(--admin-brand)] focus:ring-2"
        />
        {busy ? <p className="admin-meta mt-4">Searching…</p> : null}
        {!busy && q.trim().length >= 2 && hits.length === 0 ? (
          <p className="admin-meta mt-4">No matches.</p>
        ) : null}
        <ul className="mt-4 space-y-1">
          {hits.map((hit) => (
            <li key={`${hit.type}-${hit.id}`}>
              <Link
                to={hit.href}
                onClick={() => setOpen(false)}
                className="block rounded-[var(--admin-radius-ctl)] px-3 py-2 hover:bg-[var(--admin-border-soft)]"
              >
                <p className="text-sm font-semibold text-[var(--admin-text)]">{hit.label}</p>
                <p className="admin-meta text-xs capitalize">{hit.type} · {hit.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

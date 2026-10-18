import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Right-side panel on desktop; full-width sheet from bottom on mobile */
export function Sheet({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-[#101828]/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-sheet-title"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
          <h2 id="admin-sheet-title" className="admin-section-title">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-ctl)] text-[var(--admin-muted)] hover:bg-[var(--admin-border-soft)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </div>
  );
}

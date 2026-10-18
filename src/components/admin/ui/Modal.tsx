import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, wide }: Props) {
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-[#101828]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={`relative z-10 flex max-h-[min(90dvh,720px)] w-full flex-col border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl sm:max-h-[85dvh] sm:rounded-[var(--admin-radius-card)] ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3 sm:px-5">
          <h2 id="admin-modal-title" className="admin-section-title">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-ctl)] text-[var(--admin-muted)] hover:bg-[var(--admin-border-soft)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

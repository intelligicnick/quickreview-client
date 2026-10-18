import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export type CatalogMenuAction = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

type Props = {
  actions: CatalogMenuAction[];
  ariaLabel: string;
};

export function CatalogActionMenu({ actions, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[9rem] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={`block w-full px-3 py-2 text-left text-sm font-medium ${
                action.danger
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-ink hover:bg-paper'
              }`}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

import { cn } from '../../lib/cn';

export type TabItem<T extends string> = { id: T; label: string; badge?: React.ReactNode };

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  'aria-label': ariaLabel,
}: {
  value: T;
  onChange: (id: T) => void;
  items: TabItem<T>[];
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <nav className={cn('-mb-px flex gap-1 overflow-x-auto border-b border-line', className)} aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold',
              active ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </nav>
  );
}

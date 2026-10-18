import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type SegmentedOption<T extends string> = { id: T; label: string; badge?: ReactNode };

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: T;
  onChange: (id: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={cn('inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-[#EEF2F7] p-1', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const pressed = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-shadow',
              pressed ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {opt.label}
            {opt.badge}
          </button>
        );
      })}
    </div>
  );
}

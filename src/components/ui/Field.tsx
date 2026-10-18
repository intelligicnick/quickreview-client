import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Field({
  label,
  prefix,
  className,
  inputClassName,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  prefix?: ReactNode;
  inputClassName?: string;
}) {
  return (
    <label className={cn('block text-sm', className)}>
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          className={cn(
            'w-full min-h-11 rounded-[10px] border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-ink',
            prefix ? 'pl-12' : '',
            inputClassName,
          )}
          {...inputProps}
        />
      </div>
    </label>
  );
}

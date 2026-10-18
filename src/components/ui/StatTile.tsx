import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function StatTile({
  label,
  value,
  helper,
  accentClassName,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  accentClassName?: string;
  onClick?: () => void;
  className?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('mt-2 font-display text-[34px] font-semibold leading-none tabular-nums', accentClassName)}>
        {value}
      </p>
      {helper ? <p className="mt-1.5 text-xs text-muted">{helper}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full rounded-2xl border border-line bg-white p-4 text-left hover:border-brand/30',
          className,
        )}
      >
        {inner}
      </button>
    );
  }

  return <div className={cn('rounded-2xl border border-line bg-white p-4', className)}>{inner}</div>;
}

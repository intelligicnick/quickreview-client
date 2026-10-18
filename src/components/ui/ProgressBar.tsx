import { cn } from '../../lib/cn';

export function ProgressBar({
  value,
  max = 100,
  barClassName,
  className,
}: {
  value: number;
  max?: number;
  barClassName?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('h-2.5 overflow-hidden rounded-full bg-[#EEF2F7]', className)}>
      <div className={cn('h-full rounded-full', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

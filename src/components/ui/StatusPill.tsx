import { cn } from '../../lib/cn';

export type StatusPillVariant = 'live' | 'active' | 'expired' | 'pending' | 'offer' | 'connected';

const STYLES: Record<StatusPillVariant, { wrap: string; dot: string; label: string }> = {
  live: { wrap: 'bg-green-50 text-green-700', dot: 'bg-green-700', label: 'Live' },
  active: { wrap: 'bg-green-50 text-green-700', dot: 'bg-green-700', label: 'Active' },
  connected: { wrap: 'bg-green-50 text-green-700', dot: 'bg-green-700', label: 'Connected' },
  expired: { wrap: 'bg-red-50 text-red-700', dot: 'bg-red-700', label: 'Expired' },
  pending: { wrap: 'bg-amber-50 text-amber-800', dot: 'bg-amber-800', label: 'Pending' },
  offer: { wrap: 'bg-blue-50 text-blue-700', dot: 'bg-brand', label: 'Offer' },
};

export function StatusPill({
  variant,
  label,
  className,
}: {
  variant: StatusPillVariant;
  label?: string;
  className?: string;
}) {
  const style = STYLES[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        style.wrap,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden />
      {label ?? style.label}
    </span>
  );
}

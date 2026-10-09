export type ProductPlanStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'NONE' | 'TRIAL';

export function productPlanStatus(unlocked: boolean, status: string): ProductPlanStatus {
  if (unlocked) return 'ACTIVE';
  if (status === 'PENDING_PAYMENT') return 'PENDING_PAYMENT';
  if (status === 'EXPIRED') return 'EXPIRED';
  if (status === 'TRIAL') return 'TRIAL';
  return 'NONE';
}

export function productStatusLabel(unlocked: boolean, status: string): string {
  const s = productPlanStatus(unlocked, status);
  if (s === 'ACTIVE') return 'Active';
  if (s === 'PENDING_PAYMENT') return 'Pending payment';
  if (s === 'EXPIRED') return 'Expired';
  if (s === 'TRIAL') return 'Trial';
  return 'Not started';
}

const BADGE_CLASS: Record<ProductPlanStatus, string> = {
  ACTIVE: 'bg-brand/10 text-brand-dark',
  PENDING_PAYMENT: 'bg-amber-50 text-amber-900',
  EXPIRED: 'bg-red-50 text-red-800',
  TRIAL: 'bg-sky-50 text-sky-900',
  NONE: 'bg-paper text-muted',
};

export function ProductStatusBadge({
  unlocked,
  status,
  className = '',
}: {
  unlocked: boolean;
  status: string;
  className?: string;
}) {
  const plan = productPlanStatus(unlocked, status);
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_CLASS[plan]} ${className}`}>
      {productStatusLabel(unlocked, status)}
    </span>
  );
}

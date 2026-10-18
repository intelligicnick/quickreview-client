import {
  deriveProductPlanStatus,
  productStatusLabelFromAccess,
  type ProductAccessLike,
  type ProductPlanStatus,
} from '../lib/product-access';

export type { ProductPlanStatus };

export function productPlanStatus(
  unlocked: boolean,
  status: string,
  endDate?: string | null,
  pendingPaymentId?: string | null,
): ProductPlanStatus {
  return deriveProductPlanStatus({ unlocked, status, endDate: endDate ?? null, pendingPaymentId });
}

export function productStatusLabel(
  unlocked: boolean,
  status: string,
  endDate?: string | null,
  pendingPaymentId?: string | null,
): string {
  return productStatusLabelFromAccess({
    unlocked,
    status,
    endDate: endDate ?? null,
    pendingPaymentId,
  });
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
  endDate = null,
  pendingPaymentId = null,
  className = '',
}: ProductAccessLike & { className?: string }) {
  const plan = deriveProductPlanStatus({ unlocked, status, endDate, pendingPaymentId });
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_CLASS[plan]} ${className}`}>
      {productStatusLabelFromAccess({ unlocked, status, endDate, pendingPaymentId })}
    </span>
  );
}

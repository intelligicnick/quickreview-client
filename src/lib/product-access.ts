export type ProductPlanStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'NONE' | 'TRIAL';

export type ProductAccessLike = {
  unlocked: boolean;
  status: string;
  endDate?: string | null;
  pendingPaymentId?: string | null;
};

/** Matches server billing: plan is active through endDate (inclusive, UTC calendar day). */
export function isPlanExpired(endDate: string | null | undefined, now = new Date()): boolean {
  if (!endDate) return false;
  const today = now.toISOString().slice(0, 10);
  return endDate < today;
}

/** Merchant-facing plan status — renewal date wins over stale unlocked flags. */
export function deriveProductPlanStatus(access: ProductAccessLike): ProductPlanStatus {
  if (access.status === 'PENDING_PAYMENT' || access.pendingPaymentId) return 'PENDING_PAYMENT';
  if (isPlanExpired(access.endDate)) return 'EXPIRED';
  if (access.unlocked || access.status === 'ACTIVE') return 'ACTIVE';
  if (access.status === 'TRIAL') return 'TRIAL';
  if (access.status === 'EXPIRED') return 'EXPIRED';
  return 'NONE';
}

export function isProductAccessLive(access: ProductAccessLike): boolean {
  const status = deriveProductPlanStatus(access);
  return status === 'ACTIVE' || status === 'TRIAL';
}

export function productAccessGateReason(access: ProductAccessLike): 'live' | 'expired' | 'inactive' {
  const status = deriveProductPlanStatus(access);
  if (status === 'ACTIVE' || status === 'TRIAL') return 'live';
  if (status === 'EXPIRED') return 'expired';
  return 'inactive';
}

export function productStatusLabelFromAccess(access: ProductAccessLike): string {
  const s = deriveProductPlanStatus(access);
  if (s === 'ACTIVE') return 'Active';
  if (s === 'PENDING_PAYMENT') return 'Pending';
  if (s === 'EXPIRED') return 'Expired';
  if (s === 'TRIAL') return 'Trial';
  return 'Not started';
}

export function formatMerchantDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

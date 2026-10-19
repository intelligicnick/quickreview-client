import type { ProductAccessLike } from './product-access';
import { deriveProductPlanStatus, formatMerchantDate } from './product-access';
import { isTrialPlanCode } from './plan-codes';

export type ProductKey =
  | 'quickReview'
  | 'quickMenu'
  | 'quickConnect'
  | 'quickDesign'
  | 'quickScan'
  | 'quickCrm';

export const BILLING_PRODUCTS: {
  key: ProductKey;
  name: string;
  planProduct: string;
  badge: string;
  blurb: string;
}[] = [
  { key: 'quickReview', name: 'QuickReview', planProduct: 'QUICK_REVIEW', badge: 'R', blurb: 'Reviews, inbox, QR' },
  { key: 'quickMenu', name: 'QuickCommerce', planProduct: 'QUICK_MENU', badge: 'C', blurb: 'Catalogue & menu' },
  { key: 'quickConnect', name: 'QuickConnect', planProduct: 'QUICK_CONNECT', badge: 'N', blurb: 'Digital business card' },
  { key: 'quickDesign', name: 'QuickDesign', planProduct: 'QUICK_DESIGN', badge: 'D', blurb: 'Posters for social' },
  { key: 'quickScan', name: 'QuickScan', planProduct: 'QUICK_SCAN', badge: 'S', blurb: 'Scan cards → CRM' },
  { key: 'quickCrm', name: 'CRM', planProduct: 'QUICK_CRM', badge: 'M', blurb: 'Customers, quotes, invoices' },
];

export function isPurchasableForCheckout(access: ProductAccessLike & { planName?: string | null }): boolean {
  const status = deriveProductPlanStatus(access);
  if (status === 'PENDING_PAYMENT') return false;
  if (status === 'NONE' || status === 'EXPIRED') return true;
  if (status === 'ACTIVE' && access.planName?.toLowerCase().includes('trial')) return true;
  return false;
}

export function trialStatusLabel(access: ProductAccessLike & { planName?: string | null }): string | null {
  const status = deriveProductPlanStatus(access);
  if (status === 'EXPIRED') return 'Expired';
  if (status !== 'ACTIVE' || !access.planName?.toLowerCase().includes('trial')) return null;
  if (!access.endDate) return 'Trial ending soon';
  const today = new Date().toISOString().slice(0, 10);
  if (access.endDate === today) return 'Trial ends today';
  if (access.endDate < today) return 'Trial ended';
  return `Trial ends ${formatMerchantDate(access.endDate)}`;
}

export function monthlyPlanId(
  plans: { id: string; product: string; code: string }[],
  planProduct: string,
): string | undefined {
  return plans.find((p) => p.product === planProduct && !isTrialPlanCode(p.code))?.id;
}

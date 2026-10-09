import { api } from './api';

export type ProductAccess = {
  unlocked: boolean;
  status: string;
  planName: string | null;
  endDate: string | null;
};

export type WorkspaceSnapshot = {
  review: {
    publicUrl: string;
    publicPath: string;
    reviewUnlocked: boolean;
    reviewAccess: ProductAccess;
    stats: {
      pageViews: number;
      stars: number;
      privateFeedback: number;
      googleOpens: number;
    };
    googleReviewUrl: string | null;
  } | null;
  menu: {
    publicUrl: string;
    publicPath: string;
    menuUnlocked: boolean;
    menuAccess: ProductAccess;
  } | null;
  connect: {
    publicUrl: string;
    publicPath: string;
    connectUnlocked: boolean;
    connectAccess: ProductAccess;
    leadCount: number;
  } | null;
  billing: {
    quickReview: ProductAccess;
    quickMenu: ProductAccess;
    quickConnect: ProductAccess;
    quickDesign: ProductAccess;
    quickScan: ProductAccess;
    quickCrm: ProductAccess;
  } | null;
};

function accessFromBilling(row: {
  unlocked: boolean;
  status: string;
  planName: string | null;
  endDate: string | null;
}): ProductAccess {
  return {
    unlocked: row.unlocked,
    status: row.status,
    planName: row.planName,
    endDate: row.endDate,
  };
}

export async function loadWorkspaceSnapshot(locationId: string): Promise<WorkspaceSnapshot> {
  const [reviewResult, menuResult, connectResult, billingResult] = await Promise.allSettled([
    api<{
      publicUrl: string;
      publicPath: string;
      reviewUnlocked: boolean;
      reviewAccess: ProductAccess;
      googleReviewUrl: string | null;
      stats: {
        pageViews: number;
        stars: number;
        privateFeedback: number;
        googleOpens: number;
      };
    }>(`/api/locations/${locationId}/quickreview`),
    api<{
      publicUrl: string;
      publicPath: string;
      menuUnlocked: boolean;
      menuAccess: { status: string };
    }>(`/api/locations/${locationId}/quickmenu`),
    api<{
      publicUrl: string;
      publicPath: string;
      connectUnlocked: boolean;
      connectAccess: { unlocked: boolean; status: string };
      leadCount: number;
    }>(`/api/locations/${locationId}/quickconnect`),
    api<{
      products: {
        quickReview: ProductAccess & { pendingPaymentId?: string | null };
        quickMenu: ProductAccess & { pendingPaymentId?: string | null };
        quickConnect: ProductAccess & { pendingPaymentId?: string | null };
        quickDesign: ProductAccess & { pendingPaymentId?: string | null };
        quickScan: ProductAccess & { pendingPaymentId?: string | null };
        quickCrm: ProductAccess & { pendingPaymentId?: string | null };
      };
    }>(`/api/billing/locations/${locationId}`),
  ]);

  const billing =
    billingResult.status === 'fulfilled'
      ? {
          quickReview: accessFromBilling(billingResult.value.products.quickReview),
          quickMenu: accessFromBilling(billingResult.value.products.quickMenu),
          quickConnect: accessFromBilling(billingResult.value.products.quickConnect),
          quickDesign: accessFromBilling(billingResult.value.products.quickDesign),
          quickScan: accessFromBilling(billingResult.value.products.quickScan),
          quickCrm: accessFromBilling(billingResult.value.products.quickCrm),
        }
      : null;

  const review =
    reviewResult.status === 'fulfilled'
      ? {
          publicUrl: reviewResult.value.publicUrl,
          publicPath: reviewResult.value.publicPath,
          reviewUnlocked: reviewResult.value.reviewUnlocked,
          reviewAccess: reviewResult.value.reviewAccess,
          googleReviewUrl: reviewResult.value.googleReviewUrl,
          stats: reviewResult.value.stats,
        }
      : null;

  const menu =
    menuResult.status === 'fulfilled'
      ? {
          publicUrl: menuResult.value.publicUrl,
          publicPath: menuResult.value.publicPath,
          menuUnlocked: menuResult.value.menuUnlocked,
          menuAccess: {
            unlocked: menuResult.value.menuUnlocked,
            status: menuResult.value.menuAccess.status,
            planName: billing?.quickMenu.planName ?? null,
            endDate: billing?.quickMenu.endDate ?? null,
          },
        }
      : null;

  const connect =
    connectResult.status === 'fulfilled'
      ? {
          publicUrl: connectResult.value.publicUrl,
          publicPath: connectResult.value.publicPath,
          connectUnlocked: connectResult.value.connectUnlocked,
          connectAccess: {
            unlocked: connectResult.value.connectUnlocked,
            status: connectResult.value.connectAccess.status,
            planName: billing?.quickConnect.planName ?? null,
            endDate: billing?.quickConnect.endDate ?? null,
          },
          leadCount: connectResult.value.leadCount,
        }
      : null;

  return { review, menu, connect, billing };
}

export { productStatusLabel } from '../components/ProductStatusBadge';

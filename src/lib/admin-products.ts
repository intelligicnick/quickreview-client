/** Canonical product display names for Super Admin UI */
export const ADMIN_PRODUCT_LABEL: Record<string, string> = {
  QUICK_REVIEW: 'QuickReview',
  QUICK_MENU: 'QuickCommerce',
  QUICK_CRM: 'CRM',
  QUICK_CONNECT: 'QuickConnect',
  QUICK_DESIGN: 'QuickDesign',
  QUICK_SCAN: 'QuickScan',
};

export function productDisplayName(product: string): string {
  return ADMIN_PRODUCT_LABEL[product] ?? product;
}

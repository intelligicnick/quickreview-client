import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { deriveProductPlanStatus, formatMerchantDate, isPlanExpired } from '../lib/product-access';

type ProductAccess = {
  unlocked: boolean;
  status: string;
  endDate: string | null;
  pendingPaymentId: string | null;
};

type Billing = {
  products: {
    quickReview: ProductAccess;
    quickMenu: ProductAccess;
    quickConnect: ProductAccess;
    quickDesign: ProductAccess;
    quickScan: ProductAccess;
    quickCrm: ProductAccess;
  };
};

export function useLocationBillingSummary(locationId: string | null) {
  const [expiredDate, setExpiredDate] = useState<string | null>(null);
  const [expiredCount, setExpiredCount] = useState(0);

  useEffect(() => {
    if (!locationId) {
      setExpiredDate(null);
      setExpiredCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const billing = await api<Billing>(`/api/billing/locations/${locationId}`);
        if (cancelled) return;
        const products = Object.values(billing.products);
        const expired = products.filter((p) => deriveProductPlanStatus(p) === 'EXPIRED');
        setExpiredCount(expired.length);
        const latest = expired
          .map((p) => p.endDate)
          .filter(Boolean)
          .sort()
          .pop();
        setExpiredDate(latest ?? null);
      } catch {
        if (!cancelled) {
          setExpiredCount(0);
          setExpiredDate(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return {
    expiredCount,
    expiredLabel: expiredDate && isPlanExpired(expiredDate) ? formatMerchantDate(expiredDate) : null,
  };
}

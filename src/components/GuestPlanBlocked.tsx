import { Link } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { BrandMark } from './BrandMark';

export type GuestPlanBlockReason = 'expired' | 'inactive';

type GuestPlanBlockedProps = {
  reason: GuestPlanBlockReason;
  detail?: string | null;
};

export function guestPlanBlockFromApiError(err: unknown): GuestPlanBlockReason | null {
  if (!(err instanceof ApiError) || err.status !== 402) return null;
  if (err.code === 'PLAN_EXPIRED') return 'expired';
  if (err.code === 'PAYMENT_REQUIRED') return 'inactive';
  return 'inactive';
}

export function GuestPlanBlocked({ reason, detail }: GuestPlanBlockedProps) {
  const title = reason === 'expired' ? 'Plan expired' : 'Not available yet';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 text-center">
      <BrandMark className="h-8" />
      <h1 className="mt-6 text-xl font-bold tracking-tight text-ink">{title}</h1>
      {reason === 'expired' ? (
        <div
          className="relative mx-auto mt-5 flex h-36 w-full max-w-[260px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-white"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#e2e8f0_0,#e2e8f0_2px,transparent_2px,transparent_10px)] opacity-70 blur-[1px]" />
          <p className="relative px-4 text-sm font-semibold text-muted">Offline</p>
        </div>
      ) : null}
      {detail ? <p className="mt-4 max-w-sm text-sm text-muted">{detail}</p> : null}
      <p className="mt-4 max-w-sm text-sm text-muted">
        {reason === 'expired'
          ? 'If you own this business, sign in and renew under Plans & billing to bring this page back.'
          : 'If you own this business, activate the product in your merchant dashboard.'}
      </p>
      <Link
        to="/login"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Merchant sign in
      </Link>
    </div>
  );
}

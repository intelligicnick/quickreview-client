import { Link } from 'react-router-dom';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { QrCodePreview } from './QrCodePreview';

/** Non-scannable placeholder — real URL is never encoded while locked. */
const LOCKED_QR_VALUE = 'https://quickreview.app/plan-required';

type LockedQrGateProps = {
  /** Shown blurred in the fake link field (not copied or used for QR). */
  linkPreview?: string;
  unlockLabel?: string;
  /** When set, pill runs this instead of linking to Subscription. */
  onUnlockClick?: () => void;
  unlockTo?: string;
  className?: string;
};

export function LockedQrGate({
  linkPreview = 'https://app.quickreview.co.in/r/••••••••',
  unlockLabel = 'Select a plan to unlock QR and Review link',
  onUnlockClick,
  unlockTo = '/app/subscription',
  className = '',
}: LockedQrGateProps) {
  const pillClass =
    'max-w-[min(100%,20rem)] rounded-full bg-violet-600 px-5 py-3 text-center text-sm font-semibold leading-snug text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition-colors hover:bg-violet-700';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-white ${className}`}
      aria-label="QR and review link locked"
    >
      <div className="pointer-events-none select-none p-6 blur-[6px] sm:blur-md" aria-hidden="true">
        <div className="flex justify-center">
          <QrCodePreview value={LOCKED_QR_VALUE} size={160} label="Locked QR preview" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Review link</p>
        <div className="mt-2 rounded-xl border border-line bg-paper px-3 py-2.5 font-mono text-sm text-muted">
          {linkPreview}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-ink">
            <Copy className="h-4 w-4" />
            Copy link
          </span>
          <span className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white">
            <ExternalLink className="h-4 w-4" />
            Open page
          </span>
          <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-line px-3">
            <Download className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white">
            Save
          </span>
          <span className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-muted">
            Cancel
          </span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/25 p-4 backdrop-blur-[2px]">
        {onUnlockClick ? (
          <button type="button" onClick={onUnlockClick} className={pillClass}>
            {unlockLabel}
          </button>
        ) : (
          <Link to={unlockTo} className={pillClass}>
            {unlockLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

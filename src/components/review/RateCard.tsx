import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '../BrandMark';

export function RateCard({
  children,
  onBack,
  showBack = false,
  fill = false,
  alignTop = false,
}: {
  children: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  fill?: boolean;
  alignTop?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col bg-white sm:max-w-[420px] sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-white/80 sm:shadow-[0_20px_60px_rgba(15,23,42,0.1)] ${
        fill
          ? 'h-dvh max-h-dvh overflow-hidden sm:h-auto sm:max-h-none sm:min-h-0'
          : 'min-h-dvh sm:min-h-0'
      }`}
    >
      <div className="relative flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6">
        <div className="flex min-w-0 items-center gap-1">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to rating"
              className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-slate-50 hover:text-brand"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <BrandMark className="!h-8 max-w-[9rem]" />
        </div>
        <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-dark">
          Verified Feedback
        </span>
      </div>

      <div
        className={`flex flex-1 flex-col px-5 py-6 sm:px-6 sm:pb-7 sm:pt-4 ${
          fill || alignTop ? 'min-h-0 justify-start' : 'justify-center'
        }`}
      >
        {fill ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-line px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-muted">POWERED BY</span>
        <BrandMark className="opacity-80 !h-5 max-w-[6rem]" />
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
  /** @deprecated Use hideStatusBar — hides status bar and home indicator */
  hideNotch?: boolean;
  hideStatusBar?: boolean;
  compact?: boolean;
};

function PhoneStatusBar({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`relative z-10 flex shrink-0 items-center justify-between text-ink ${
        compact ? 'h-6 px-3 pt-1 text-[9px] font-semibold' : 'h-7 px-4 pt-1.5 text-[10px] font-semibold'
      }`}
      aria-hidden
    >
      <span>9:41</span>
      <span
        className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-ink ${
          compact ? 'top-1 h-4 w-11' : 'top-1.5 h-[18px] w-[52px]'
        }`}
      />
      <span className="flex items-center gap-0.5">
        <span className={`rounded-sm bg-ink/85 ${compact ? 'h-2 w-2.5' : 'h-2.5 w-3'}`} />
        <span className={`rounded-sm bg-ink/85 ${compact ? 'h-2 w-3' : 'h-2.5 w-3.5'}`} />
        <span className={`rounded-[1px] bg-ink/85 ${compact ? 'h-2 w-3.5' : 'h-2.5 w-4'}`} />
      </span>
    </div>
  );
}

function PhoneHomeIndicator({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex shrink-0 justify-center ${compact ? 'pb-1 pt-0.5' : 'pb-1.5 pt-1'}`} aria-hidden>
      <span className={`rounded-full bg-ink/20 ${compact ? 'h-[3px] w-16' : 'h-1 w-24'}`} />
    </div>
  );
}

/** Phone bezel for in-app guest previews (merchant editor sidebars). */
export function MobileScreenFrame({
  children,
  className = '',
  screenClassName = '',
  hideNotch = false,
  hideStatusBar,
  compact = false,
}: Props) {
  const showChrome = !(hideStatusBar ?? hideNotch);

  return (
    <div className={className}>
      <div
        className={`mx-auto w-full shadow-xl ring-1 ring-black/10 ${
          compact ? 'max-w-[220px]' : 'max-w-[300px]'
        } rounded-[2rem] bg-slate-900 p-[3px]`}
      >
        <div
          className={`flex flex-col overflow-hidden rounded-[1.72rem] bg-white ${
            compact ? 'aspect-[9/19.5] w-full' : 'min-h-[34rem]'
          } ${screenClassName}`}
        >
          {showChrome ? <PhoneStatusBar compact={compact} /> : null}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          {showChrome ? <PhoneHomeIndicator compact={compact} /> : null}
        </div>
      </div>
    </div>
  );
}

export function GuestPreviewHeading({ children = 'Guest preview' }: { children?: string }) {
  return (
    <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>
  );
}

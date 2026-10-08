import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
  hideNotch?: boolean;
  compact?: boolean;
};

/** Phone bezel for in-app guest previews (merchant editor sidebars). */
export function MobileScreenFrame({
  children,
  className = '',
  screenClassName = '',
  hideNotch = false,
  compact = false,
}: Props) {
  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[300px] rounded-[2.25rem] border-[9px] border-ink bg-ink p-1 shadow-xl">
        <div
          className={`flex flex-col overflow-hidden rounded-[1.65rem] bg-white ${
            compact ? 'min-h-[28rem]' : 'min-h-[34rem]'
          } ${screenClassName}`}
        >
          {hideNotch ? null : (
            <div className="flex shrink-0 justify-center pb-1 pt-2" aria-hidden>
              <span className="h-[22px] w-[88px] rounded-full bg-ink" />
            </div>
          )}
          {children}
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

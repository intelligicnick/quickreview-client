import type { ReactNode } from 'react';

type Props = {
  visual: ReactNode;
  children: ReactNode;
  reverse?: boolean;
  className?: string;
};

export function LandingSplitSection({ visual, children, reverse = false, className = '' }: Props) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${className}`}
    >
      <div className={reverse ? 'lg:order-2' : ''}>{visual}</div>
      <div className={reverse ? 'lg:order-1' : ''}>{children}</div>
    </div>
  );
}

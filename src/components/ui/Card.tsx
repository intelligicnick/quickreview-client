import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Card({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn('overflow-hidden rounded-2xl border border-line bg-white', className)}>
      <div className="p-6">{children}</div>
      {footer ? <div className="border-t border-line bg-surface-2 px-6 py-4">{footer}</div> : null}
    </article>
  );
}

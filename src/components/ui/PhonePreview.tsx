import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function PhonePreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[300px]', className)}>
      <div
        className="flex min-h-[34rem] flex-col overflow-hidden rounded-[42px] border-[10px] border-ink bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <p className="shrink-0 py-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
          Powered by QuickReview
        </p>
      </div>
    </div>
  );
}

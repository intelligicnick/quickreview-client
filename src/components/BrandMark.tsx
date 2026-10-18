import { Star } from 'lucide-react';
import { cn } from '../lib/cn';

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand text-white"
        aria-hidden
      >
        <Star className="h-[18px] w-[18px] stroke-[1.8]" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-ink">
        Quick<span className="text-brand">Review</span>
      </span>
    </div>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function IconButton({
  className,
  children,
  'aria-label': ariaLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; 'aria-label': string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-ink hover:bg-line-soft',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

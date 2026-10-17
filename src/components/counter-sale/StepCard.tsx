import type { ReactNode } from 'react';
import { IconCheck } from './icons';

type StepCardProps = {
  step: number;
  title: string;
  done?: boolean;
  children: ReactNode;
};

export function StepCard({ step, title, done = false, children }: StepCardProps) {
  return (
    <section className="rounded-[18px] border border-[#E3E8EF] bg-white p-4">
      <div className="flex items-center gap-2.5">
        {done ? (
          <span
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#0F7B4B] text-white"
            aria-hidden
          >
            <IconCheck className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#EAF1FE] text-[13px] font-semibold text-[#1A5FD6]"
            aria-hidden
          >
            {step}
          </span>
        )}
        <h2 className="text-[15px] font-semibold leading-snug text-[#0F172A]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

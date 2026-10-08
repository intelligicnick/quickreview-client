import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  visual: ReactNode;
};

export function LandingHighlightCard({ icon: Icon, title, description, visual }: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_12px_40px_rgba(27,35,51,0.06)]">
      <div className="p-6 sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="font-display mt-4 text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      </div>
      <div className="landing-card-well relative mt-auto min-h-[220px] overflow-hidden border-t border-line/60 sm:min-h-[240px]">
        {visual}
      </div>
    </article>
  );
}

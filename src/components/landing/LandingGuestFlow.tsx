import { ArrowRight, MessageSquareWarning, QrCode, Sparkles, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FLOW: { icon: LucideIcon; title: string; detail: string; tag?: string }[] = [
  { icon: QrCode, title: 'Scan QR', detail: 'At counter or table — no app download' },
  { icon: Star, title: 'Rate visit', detail: '1–5 stars in seconds on your branded page' },
  {
    icon: Sparkles,
    title: 'AI draft or private form',
    detail: '4–5★ answer quick questions → AI draft to edit; 1–3★ stay internal',
    tag: 'Smart routing',
  },
  { icon: MessageSquareWarning, title: 'Post or fix', detail: 'Happy guests copy to Google; you resolve complaints first' },
];

export function LandingGuestFlow() {
  return (
    <div className="mt-10 overflow-x-auto pb-2">
      <ol className="flex min-w-[min(100%,52rem)] gap-3 sm:min-w-0 sm:grid sm:grid-cols-4 sm:gap-4">
        {FLOW.map((step, index) => {
          const Icon = step.icon;
          return (
          <li key={step.title} className="relative flex min-w-[9.5rem] flex-1 flex-col sm:min-w-0">
            <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <span
                className="font-display inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-xs font-extrabold text-brand"
                aria-hidden
              >
                {index + 1}
              </span>
              <span className="mt-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-paper text-brand">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {step.tag ? (
                <span className="mt-2 inline-flex w-fit rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/80">
                  {step.tag}
                </span>
              ) : null}
              <h3 className="mt-2 text-sm font-bold text-ink">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{step.detail}</p>
            </div>
            {index < FLOW.length - 1 ? (
              <ArrowRight
                className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-brand/40 sm:block"
                aria-hidden
              />
            ) : null}
          </li>
          );
        })}
      </ol>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';

export function LandingReferralBand() {
  return (
    <section id="refer" className="scroll-mt-20 bg-ink py-12 text-white sm:py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:flex-row lg:text-left">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold"
          aria-hidden
        >
          <Gift className="h-7 w-7" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Refer &amp; earn</p>
          <h2 className="font-display mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
            Refer a local business — you both get 10% off
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
            Know a café, salon, or shop that needs more Google reviews? Share QuickReview. When they
            subscribe, you each receive 10% off your next billing cycle — stackable with free
            workspace onboarding.
          </p>
        </div>
        <Link
          to="/register"
          className="inline-flex min-h-11 shrink-0 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-ink transition hover:bg-white/90"
        >
          Start free, then refer
        </Link>
      </div>
    </section>
  );
}

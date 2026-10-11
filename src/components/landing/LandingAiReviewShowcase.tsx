const SAMPLES = [
  {
    business: 'Restaurant',
    lang: 'English',
    text:
      'Warm service and a spotless dining area. The team remembered our order — dinner felt effortless. Highly recommend for a quick, quality meal.',
    keywords: ['warm service', 'quality meal'],
  },
  {
    business: 'Salon',
    lang: 'Hindi',
    text:
      'Salon ka experience bahut accha tha. Staff ne styling carefully ki, jagah bilkul clean thi — next visit ke liye definitely recommend.',
    keywords: ['great styling', 'clean salon'],
  },
  {
    business: 'Hotel',
    lang: 'Telugu',
    text:
      'Hotel stay chala comfortable ga undi. Room clean ga undi, staff friendly — check-in smooth ga jarigindi.',
    keywords: ['clean rooms', 'smooth check-in'],
  },
] as const;

export function LandingAiReviewShowcase() {
  return (
    <section className="scroll-mt-20 border-y border-line bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">AI review drafts</p>
            <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Never send customers to a blank Google box
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Pick languages and keywords — like &ldquo;friendly staff&rdquo; or &ldquo;clean
              environment&rdquo; — and QuickReview suggests natural drafts happy guests can copy and
              post in one tap.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                Multiple drafts per scan, tuned to your business type
              </li>
              <li className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                Low ratings never hit Google — they land in private feedback
              </li>
              <li className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                Print-ready QR standees from your dashboard
              </li>
            </ul>
          </div>
          <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-1 sm:overflow-visible sm:pb-0 lg:max-h-[28rem] lg:overflow-y-auto lg:pr-1">
            {SAMPLES.map((sample) => (
              <article
                key={sample.business + sample.lang}
                className="min-w-[min(100%,18rem)] shrink-0 snap-center rounded-2xl border border-line bg-paper/80 p-5 shadow-[0_12px_40px_rgba(27,35,51,0.06)] sm:min-w-0"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
                  <span>{sample.business}</span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-ink ring-1 ring-line">
                    {sample.lang}
                  </span>
                </div>
                <p className="mt-1 text-amber-500" aria-label="5 out of 5 stars">
                  ★★★★★
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/90">&ldquo;{sample.text}&rdquo;</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sample.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

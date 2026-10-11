const STATS = [
  {
    value: '97%',
    label: 'of people read reviews before choosing a local business',
  },
  {
    value: '35%',
    label: 'more revenue when owners reply to at least a quarter of reviews',
  },
  {
    value: '+9%',
    label: 'revenue lift for every extra star on your Google average',
  },
] as const;

export function LandingReputationStats() {
  return (
    <section id="why-reviews" className="scroll-mt-20 border-b border-line bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">The reputation gap</p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Why your Google rating can&apos;t wait
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Prospects decide before they walk in. Silence and unresolved complaints both cost you —
            QuickReview turns happy visits into public reviews and unhappy ones into private fixes.
          </p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-3">
          {STATS.map(({ value, label }) => (
            <li
              key={value}
              className="rounded-2xl border border-line bg-paper/60 p-6 text-center shadow-[0_8px_30px_rgba(27,35,51,0.04)] sm:p-7"
            >
              <p className="font-display text-4xl font-extrabold tracking-tight text-brand sm:text-[2.75rem]">
                {value}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

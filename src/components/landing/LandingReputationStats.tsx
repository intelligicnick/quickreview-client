const STATS = [
  {
    value: '9 in 10',
    label: 'shoppers check online sentiment before they pick a local spot',
  },
  {
    value: '1 in 4',
    label: 'review replies answered — yet that habit alone can lift revenue ~35%',
  },
  {
    value: '+9%',
    label: 'typical sales bump for each full star on your public average',
  },
] as const;

export function LandingReputationStats() {
  return (
    <section id="why-trust" className="scroll-mt-20 border-b border-line bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Local trust math</p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Search results decide who walks through your door
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Empty review feeds and ignored complaints look the same to strangers: risky. QuickReview
            amplifies praise in public and keeps hard conversations private until you fix them.
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

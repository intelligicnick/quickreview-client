const SAMPLES = [
  {
    business: 'Bakery',
    lang: 'English',
    text:
      'Croissants were still warm at 8am and the barista spelled my name right on the cup. Small shop, big care — already planning Saturday brunch here.',
    keywords: ['fresh pastry', 'friendly barista'],
  },
  {
    business: 'Clinic',
    lang: 'Hindi',
    text:
      'Appointment time par mila, doctor ne calmly samjhaya. Waiting area saaf tha aur staff respectful — family ke liye safe feel hua.',
    keywords: ['on-time care', 'clean clinic'],
  },
  {
    business: 'Gym',
    lang: 'Telugu',
    text:
      'Equipment maintenance chala bagundi, trainers approachable. Locker rooms tidy — morning workouts ki perfect vibe.',
    keywords: ['well maintained', 'helpful trainers'],
  },
] as const;

export function LandingAiReviewShowcase() {
  return (
    <section className="scroll-mt-20 border-y border-line bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Writing assist</p>
            <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Guests rarely know what to type — we start the sentence
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Choose languages and phrases that matter to you (&ldquo;quick seating&rdquo;,
              &ldquo;spotless washroom&rdquo;). The system proposes human-sounding lines they can tweak
              before posting publicly.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                Several variants per visit, shaped by your category
              </li>
              <li className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                Critical scores skip Google and land in your inbox
              </li>
              <li className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                Export standee artwork when you are ready to print
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

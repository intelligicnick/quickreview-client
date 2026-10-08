export function StatsLineChartVisual() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-ink p-5 shadow-xl sm:p-6"
      aria-hidden
    >
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">This week</p>
          <p className="font-display text-2xl font-extrabold text-white">+32%</p>
          <p className="text-xs text-white/60">Guest engagement</p>
        </div>
        <div className="flex gap-3 text-[10px] text-white/70">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Views
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Stars
          </span>
        </div>
      </div>
      <svg viewBox="0 0 280 100" className="mt-4 h-auto w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="landingChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(26,109,255,0.45)" />
            <stop offset="100%" stopColor="rgba(26,109,255,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,70 L40,62 L80,58 L120,45 L160,48 L200,32 L240,28 L280,18 L280,100 L0,100 Z"
          fill="url(#landingChartFill)"
        />
        <polyline
          fill="none"
          stroke="#1a6dff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="0,70 40,62 80,58 120,45 160,48 200,32 240,28 280,18"
        />
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
          points="0,78 40,72 80,68 120,60 160,55 200,50 240,44 280,38"
        />
      </svg>
    </div>
  );
}

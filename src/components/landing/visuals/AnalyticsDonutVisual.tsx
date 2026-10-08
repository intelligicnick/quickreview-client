const SEGMENTS = [
  { pct: 45, color: '#1a6dff', label: 'Views' },
  { pct: 30, color: '#38bdf8', label: 'Stars' },
  { pct: 25, color: '#f5b400', label: 'Google' },
];

function Donut() {
  let offset = 0;
  const r = 36;
  const c = 2 * Math.PI * r;

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" aria-hidden>
      {SEGMENTS.map((seg) => {
        const dash = (seg.pct / 100) * c;
        const el = (
          <circle
            key={seg.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          />
        );
        offset += dash;
        return el;
      })}
      <circle cx="50" cy="50" r="24" fill="white" />
      <text x="50" y="52" textAnchor="middle" className="fill-ink text-[10px] font-bold">
        248
      </text>
    </svg>
  );
}

export function AnalyticsDonutVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-4 ${compact ? '' : 'rounded-2xl border border-line bg-white p-4 shadow-sm'}`}
      aria-hidden
    >
      <Donut />
      <div className="space-y-2">
        {SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            <span className="font-semibold text-ink">{seg.label}</span>
            <span className="text-muted">{seg.pct}%</span>
          </div>
        ))}
        <svg viewBox="0 0 80 24" className="mt-2 h-6 w-20 text-brand" aria-hidden>
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            points="0,20 16,14 32,16 48,8 64,10 80,4"
          />
        </svg>
      </div>
    </div>
  );
}

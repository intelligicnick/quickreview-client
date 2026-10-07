type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatPill({ label, value, hint }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm shadow-slate-200/40">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

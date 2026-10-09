/** Merchant-facing plan dates: "11 Oct · 5 days left" */
export function formatPlanEnd(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return iso;
  const day = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const today = startOfDay(new Date());
  const target = startOfDay(end);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0) return `${day} · expired`;
  if (daysLeft === 0) return `${day} · ends today`;
  if (daysLeft === 1) return `${day} · 1 day left`;
  return `${day} · ${daysLeft} days left`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

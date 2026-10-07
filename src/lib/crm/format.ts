const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatInr(amount: number): string {
  return INR.format(amount);
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelativeDay(iso: string): string {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return formatShortDate(iso);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isBeforeToday(iso: string): boolean {
  return startOfDay(new Date(iso)) < startOfDay(new Date());
}

export function isToday(iso: string): boolean {
  return isSameDay(new Date(iso), new Date());
}

export function paymentStatus(sale: { amount: number; received: number }): import('./types').PaymentStatus {
  if (sale.received <= 0) return 'pending';
  if (sale.received >= sale.amount) return 'paid';
  return 'partial';
}

export function pendingAmount(sale: { amount: number; received: number }): number {
  return Math.max(0, sale.amount - sale.received);
}

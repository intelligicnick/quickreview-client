const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** ₹1,234 — use everywhere for INR */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** @deprecated use formatINR */
export const inr = formatINR;

/** 18 Oct 2026 */
export function formatDate(value: string | Date): string {
  const d = parseDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** 18 Oct, 12:37 pm */
export function formatDateTime(value: string | Date): string {
  const d = parseDate(value);
  const hours = d.getHours();
  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'pm' : 'am';
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${h12}:${mins} ${ampm}`;
}

/** @deprecated use formatDateTime */
export function adminWhen(value: string) {
  return formatDateTime(value);
}

/** "6 days", "1 day", "today" */
export function relativeAge(value: string | Date): string {
  const d = parseDate(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural ?? `${singular}s`}`;
}

export function isValidUtr(value: string): boolean {
  return /^\d{12}$/.test(value.trim());
}

export function utrDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

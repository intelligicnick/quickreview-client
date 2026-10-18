/** Display Indian mobile numbers as +91 90299 65109 */
export function formatIndianPhone(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return raw.trim();
}

export function normalizeIndianPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.startsWith('91')) return digits.slice(0, 12);
  return digits.slice(0, 10);
}

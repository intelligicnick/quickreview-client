/** Normalize Indian mobile to digits for tel:/wa.me (ponytail: assumes +91 if 10 digits). */
export function normalizePhone(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export function telHref(mobile: string): string {
  return `tel:+${normalizePhone(mobile)}`;
}

export function whatsAppHref(mobile: string, text?: string): string {
  const base = `https://wa.me/${normalizePhone(mobile)}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function paymentReminderMessage(name: string, pending: number): string {
  return `Hi ${name}, this is a friendly reminder about the pending payment of ₹${pending.toLocaleString('en-IN')}. Please let us know if you need any help. Thank you!`;
}

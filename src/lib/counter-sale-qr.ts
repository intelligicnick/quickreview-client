export const STANDEE_CODE_LEN = 8;

/** Matches `newReviewCode()` alphabet (no I, O, 0, 1). */
export const STANDEE_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export function isValidStandeeCode(code: string): boolean {
  return STANDEE_CODE_RE.test(code);
}

/** Match server counter-sale QR code normalization. */
export function parseStandeeQrInput(raw: string): string {
  const trimmed = raw.trim();
  const fromPath = trimmed.match(/\/q\/([A-Za-z0-9]+)/i)?.[1];
  if (fromPath) return fromPath.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  try {
    const withProto = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProto);
    const parts = url.pathname.split('/').filter(Boolean);
    const qIdx = parts.findIndex((p) => p.toLowerCase() === 'q');
    if (qIdx >= 0 && parts[qIdx + 1]) {
      return parts[qIdx + 1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }
  } catch {
    /* not a URL */
  }

  return trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function normalizeStandeeCode(raw: string): string {
  const parsed = parseStandeeQrInput(raw);
  if (parsed.length <= STANDEE_CODE_LEN) return parsed;
  const tail = parsed.slice(-STANDEE_CODE_LEN);
  if (isValidStandeeCode(tail)) return tail;
  return parsed.slice(0, STANDEE_CODE_LEN);
}

export type QrLookupStatus = 'ready' | 'assigned' | 'not_found' | 'not_printed';

export function qrLookupMessage(status: QrLookupStatus): string {
  switch (status) {
    case 'ready':
      return 'Standee found — ready to link.';
    case 'assigned':
      return 'This standee is already linked. Scan a different QR.';
    case 'not_printed':
      return 'This code is not standee stock yet. Ask admin to mark it printed.';
    case 'not_found':
      return 'Code not in QuickReview stock. Check the code or scan again.';
    default:
      return 'Could not verify this code.';
  }
}

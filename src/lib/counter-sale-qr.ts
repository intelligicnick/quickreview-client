export const STANDEE_CODE_LEN = 8;

/** Match server counter-sale QR code normalization. */
export function parseStandeeQrInput(raw: string): string {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/\/q\/([A-Za-z0-9]+)/i)?.[1];
  const base = fromUrl ?? trimmed;
  return base.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function normalizeStandeeCode(raw: string): string {
  return parseStandeeQrInput(raw).slice(0, STANDEE_CODE_LEN);
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

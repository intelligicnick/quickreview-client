const DEFAULT_BY_NAME: Record<string, string> = {
  'Acrylic standee — Review QR': '/marketplace/standee-review-qr.svg',
  'Acrylic standee — Menu QR': '/marketplace/standee-menu-qr.svg',
  'NFC review card': '/marketplace/nfc-review-card.svg',
};

function catalogImagePath(raw: string): string {
  if (/^https?:\/\//i.test(raw)) {
    try {
      const { pathname } = new URL(raw);
      if (pathname.startsWith('/marketplace/')) return pathname;
    } catch {
      /* keep external absolute URL */
    }
    return raw;
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function marketplaceImageSrc(
  imageUrl: string | null | undefined,
  productName?: string,
): string | null {
  const raw = imageUrl?.trim() || (productName ? DEFAULT_BY_NAME[productName] : undefined);
  if (!raw) return null;
  return catalogImagePath(raw);
}

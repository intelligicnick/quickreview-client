const DEFAULT_BY_NAME: Record<string, string> = {
  'Acrylic standee — Review QR': '/marketplace/standee-review-qr.svg',
  'Acrylic standee — Menu QR': '/marketplace/standee-menu-qr.svg',
  'NFC review card': '/marketplace/nfc-review-card.svg',
};

export function marketplaceImageSrc(
  imageUrl: string | null | undefined,
  productName?: string,
): string | null {
  const raw = imageUrl?.trim() || (productName ? DEFAULT_BY_NAME[productName] : undefined);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

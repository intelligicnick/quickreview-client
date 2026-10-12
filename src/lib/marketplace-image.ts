const STANDEE_REVIEW = '/marketplace/standee-review-qr.png';
const STANDEE_MENU = '/marketplace/standee-menu-qr.png';
const NFC_CARD = '/marketplace/nfc-review-card.svg';

const DEFAULT_BY_NAME: Record<string, string> = {
  'Acrylic standee — Review QR': STANDEE_REVIEW,
  'Acrylic standee — Menu QR': STANDEE_MENU,
  'NFC review card': NFC_CARD,
};

const LEGACY_IMAGE_UPGRADES: Record<string, string> = {
  '/marketplace/standee-review-qr.svg': STANDEE_REVIEW,
  '/marketplace/standee-menu-qr.svg': STANDEE_MENU,
};

function defaultImageByProductName(name: string): string | undefined {
  const exact = DEFAULT_BY_NAME[name];
  if (exact) return exact;
  const lower = name.toLowerCase();
  if (lower.includes('menu') && lower.includes('qr')) return STANDEE_MENU;
  if (lower.includes('nfc') || (lower.includes('card') && lower.includes('review'))) return NFC_CARD;
  if (lower.includes('standee') || (lower.includes('review') && lower.includes('qr'))) return STANDEE_REVIEW;
  return undefined;
}

function catalogImagePath(raw: string): string {
  if (/^https?:\/\//i.test(raw)) {
    try {
      const { pathname } = new URL(raw);
      if (pathname.startsWith('/marketplace/')) {
        return LEGACY_IMAGE_UPGRADES[pathname] ?? pathname;
      }
    } catch {
      /* keep external absolute URL */
    }
    return raw;
  }
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return LEGACY_IMAGE_UPGRADES[path] ?? path;
}

export function marketplaceImageSrc(
  imageUrl: string | null | undefined,
  productName?: string,
): string | null {
  const raw = imageUrl?.trim() || (productName ? defaultImageByProductName(productName) : undefined);
  if (!raw) return null;
  return catalogImagePath(raw);
}

export function marketplaceDimensionBadge(dimensions: string | null | undefined): string | null {
  if (!dimensions?.trim()) return null;
  const d = dimensions.toLowerCase();
  if (d.includes('4×6') || d.includes('4x6')) return '4×6 Inches';
  if (d.includes('85.6') || d.includes('cr80') || d.includes('54 mm')) return 'CR80';
  return dimensions.split('(')[0]?.trim() || dimensions;
}

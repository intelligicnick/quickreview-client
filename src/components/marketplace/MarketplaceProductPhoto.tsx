import { marketplaceImageSrc } from '../../lib/marketplace-image';

type ProductLike = {
  name: string;
  imageUrl: string | null;
  dimensions?: string | null;
};

function previewAspect(product: ProductLike): string {
  const name = product.name.toLowerCase();
  const dims = (product.dimensions ?? '').toLowerCase();
  if (name.includes('nfc') || name.includes('card') || dims.includes('mm') || dims.includes('cr80')) {
    return 'aspect-[856/540]';
  }
  if (name.includes('tent') || dims.includes('5×7') || dims.includes('5x7')) {
    return 'aspect-[5/7]';
  }
  if (name.includes('standee') || dims.includes('6')) {
    return 'aspect-[2/3]';
  }
  return 'aspect-[4/3]';
}

export function MarketplaceProductPhoto({
  product,
  className = '',
  placeholderClassName = '',
}: {
  product: ProductLike;
  className?: string;
  placeholderClassName?: string;
}) {
  const aspect = previewAspect(product);
  const imageSrc = marketplaceImageSrc(product.imageUrl, product.name);
  if (!imageSrc) {
    return (
      <div
        className={`flex ${aspect} w-full items-center justify-center rounded-xl bg-paper text-xs font-semibold text-muted ${placeholderClassName}`}
      >
        Photo coming soon
      </div>
    );
  }
  return (
    <img
      src={imageSrc}
      alt=""
      className={`${aspect} w-full rounded-xl bg-paper object-contain ${className}`}
    />
  );
}

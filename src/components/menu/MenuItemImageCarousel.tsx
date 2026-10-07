import { Croissant, Gem, Scissors, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useRef } from 'react';

export type MenuImagePlaceholder = 'food' | 'bakery' | 'jewellery' | 'retail' | 'services';

type Props = {
  imageUrls?: string[];
  imageUrl?: string | null;
  alt: string;
  placeholder: MenuImagePlaceholder;
  size?: 'sm' | 'md';
};

const PLACEHOLDER_CLASS =
  'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 text-amber-800';

function PlaceholderIcon({ kind }: { kind: MenuImagePlaceholder }) {
  const className = 'h-6 w-6';
  switch (kind) {
    case 'bakery':
      return <Croissant className={className} strokeWidth={1.5} />;
    case 'jewellery':
      return <Gem className={className} strokeWidth={1.5} />;
    case 'services':
      return <Scissors className={className} strokeWidth={1.5} />;
    case 'retail':
      return <ShoppingBag className={className} strokeWidth={1.5} />;
    case 'food':
    default:
      return <UtensilsCrossed className={className} strokeWidth={1.5} />;
  }
}

export function MenuItemImageCarousel({
  imageUrls,
  imageUrl,
  alt,
  placeholder,
  size = 'md',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const urls = (imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []).slice(0, 2);
  const box = size === 'sm' ? 'h-14 w-14' : 'h-16 w-16';

  if (!urls.length) {
    return (
      <div className={`${PLACEHOLDER_CLASS} ${box}`} aria-hidden>
        <PlaceholderIcon kind={placeholder} />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className={`${box} shrink-0 overflow-hidden rounded-xl border border-line/60 bg-paper`}>
        <img src={urls[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`${box} flex shrink-0 snap-x snap-mandatory overflow-x-auto rounded-xl border border-line/60 bg-paper [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      aria-label={`${alt} photos`}
    >
      {urls.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={index === 0 ? alt : `${alt} ${index + 1}`}
          className="h-full w-full shrink-0 snap-center object-cover"
          draggable={false}
        />
      ))}
    </div>
  );
}

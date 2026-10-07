import type { PriceVariant } from '../../lib/menu-pricing';

type Props = {
  variants: PriceVariant[];
  singlePrice: string;
  variantPrices: Record<string, string>;
  onSinglePriceChange: (value: string) => void;
  onVariantPriceChange: (variantId: string, value: string) => void;
};

export function MenuItemPriceInputs({
  variants,
  singlePrice,
  variantPrices,
  onSinglePriceChange,
  onVariantPriceChange,
}: Props) {
  if (!variants.length) {
    return (
      <input
        placeholder="Price ₹"
        className="w-24 rounded-xl border border-line px-3 py-2 text-sm"
        value={singlePrice}
        onChange={(e) => onSinglePriceChange(e.target.value)}
      />
    );
  }

  if (variants.length === 1) {
    const id = variants[0]!.id;
    return (
      <input
        placeholder={`${variants[0]!.name} ₹`}
        className="w-28 rounded-xl border border-line px-3 py-2 text-sm"
        value={variantPrices[id] ?? singlePrice}
        onChange={(e) => onVariantPriceChange(id, e.target.value)}
      />
    );
  }

  return (
    <>
      {variants.map((variant) => (
        <input
          key={variant.id}
          placeholder={`${variant.name} ₹`}
          className="w-28 rounded-xl border border-line px-3 py-2 text-sm"
          value={variantPrices[variant.id] ?? ''}
          onChange={(e) => onVariantPriceChange(variant.id, e.target.value)}
        />
      ))}
    </>
  );
}

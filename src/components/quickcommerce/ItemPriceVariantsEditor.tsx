import type { ProductOptionDraft } from '../../lib/menu-pricing';

type Props = {
  options: ProductOptionDraft[];
  singlePrice: string;
  onOptionsChange: (options: ProductOptionDraft[]) => void;
  onSinglePriceChange: (value: string) => void;
};

export function ItemPriceVariantsEditor({
  options,
  singlePrice,
  onOptionsChange,
  onSinglePriceChange,
}: Props) {
  if (!options.length) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Price ₹"
          className="w-24 rounded-xl border border-line px-3 py-2 text-sm"
          value={singlePrice}
          onChange={(e) => onSinglePriceChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => onOptionsChange([{ name: '', price: '' }])}
          className="rounded-xl border border-line px-3 py-2 text-xs font-semibold"
        >
          Add variation
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-xl border border-dashed border-line bg-paper/60 px-3 py-3">
      <p className="text-xs font-semibold text-muted">Variations (size, pack, weight…)</p>
      {options.map((row, index) => (
        <div key={row.id ?? `opt-${index}`} className="flex flex-wrap gap-2">
          <input
            placeholder="e.g. Half litre"
            className="min-w-[7rem] flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
            value={row.name}
            onChange={(e) =>
              onOptionsChange(
                options.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
              )
            }
          />
          <input
            placeholder="₹"
            className="w-24 rounded-lg border border-line px-2 py-1.5 text-sm"
            value={row.price}
            onChange={(e) =>
              onOptionsChange(
                options.map((r, i) => (i === index ? { ...r, price: e.target.value } : r)),
              )
            }
          />
          <button
            type="button"
            onClick={() => onOptionsChange(options.filter((_, i) => i !== index))}
            className="rounded-lg px-2 text-xs font-semibold text-muted hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onOptionsChange([...options, { name: '', price: '' }])}
        className="rounded-lg border border-line px-3 py-1 text-xs font-semibold"
      >
        Add variation
      </button>
    </div>
  );
}

type SelectableCardProps = {
  name: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  layout?: 'row' | 'grid';
  nameId?: string;
};

export function SelectableCard({
  name,
  description,
  selected,
  onSelect,
  layout = 'row',
  nameId,
}: SelectableCardProps) {
  const minH = layout === 'grid' ? 'min-h-[108px]' : 'min-h-[64px]';

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full ${minH} gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors cs-focus ${
        selected
          ? 'border-[#1A5FD6] bg-[#F1F6FE]'
          : 'border-[#E3E8EF] bg-white hover:bg-[#F4F6FA]'
      }`}
    >
      <span
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-[#1A5FD6]' : 'border-[#D5DCE6]'
        }`}
        aria-hidden
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-[#1A5FD6]" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span
          id={nameId}
          className={`block text-[15px] leading-snug text-[#0F172A] ${
            layout === 'grid' ? 'font-bold break-words' : 'truncate font-semibold'
          }`}
        >
          {name}
        </span>
        {description ? (
          <span className="mt-0.5 block line-clamp-2 text-[13px] leading-snug text-[#5B6474]">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

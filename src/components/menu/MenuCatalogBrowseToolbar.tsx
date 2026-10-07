type Props = {
  search: string;
  categoryId: string | 'all';
  categories: Array<{ id: string; name: string }>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string | 'all') => void;
};

export function MenuCatalogBrowseToolbar({
  search,
  categoryId,
  categories,
  onSearchChange,
  onCategoryChange,
}: Props) {
  return (
    <div className="mt-4 space-y-3">
      <label className="block">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>
      {categories.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              categoryId === 'all' ? 'bg-brand text-white' : 'border border-line bg-white text-ink'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                categoryId === category.id ? 'bg-brand text-white' : 'border border-line bg-white text-ink'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

import { GripVertical, Plus } from 'lucide-react';

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
  addLabel: string;
  newName: string;
  onNewNameChange: (value: string) => void;
  onAdd: () => void;
  showAddField: boolean;
  onToggleAddField: () => void;
};

export function CatalogCategoryPills({
  categories,
  activeId,
  onSelect,
  addLabel,
  newName,
  onNewNameChange,
  onAdd,
  showAddField,
  onToggleAddField,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((category) => {
          const active = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${
                active
                  ? 'bg-ink text-white shadow-sm'
                  : 'border border-line bg-white text-ink hover:border-brand/30'
              }`}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
              {category.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onToggleAddField}
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-brand/30"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </button>
      </div>
      {showAddField ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1 text-sm">
            <span className="font-semibold">{addLabel}</span>
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              placeholder="Name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAdd();
              }}
            />
          </label>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      ) : null}
      {categories.length > 1 ? (
        <p className="text-xs text-muted">Drag a tab to reorder categories — coming soon.</p>
      ) : null}
    </div>
  );
}

type Tab = {
  id: string;
  label: string;
  enabled: boolean;
};

type Props = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function CatalogWorkspaceTabs({ tabs, activeId, onChange }: Props) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-line pb-1" aria-label="Catalogue sections">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            onClick={() => tab.enabled && onChange(tab.id)}
            className={`rounded-t-lg px-3 py-2 text-sm font-semibold transition ${
              !tab.enabled
                ? 'cursor-not-allowed text-muted/50'
                : active
                  ? 'border-b-2 border-brand text-brand'
                  : 'text-muted hover:text-ink'
            }`}
            title={!tab.enabled ? 'Coming soon' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

import {
  Ban,
  BookOpen,
  Layers,
  QrCode,
  Star,
  Upload,
  type LucideIcon,
} from 'lucide-react';

type Tab = {
  id: string;
  label: string;
  enabled: boolean;
};

const TAB_ICONS: Record<string, LucideIcon> = {
  primary: BookOpen,
  bundles: Layers,
  featured: Star,
  unavailable: Ban,
  qr: QrCode,
  import: Upload,
};

type Props = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function CatalogWorkspaceTabs({ tabs, activeId, onChange }: Props) {
  return (
    <nav
      className="flex flex-wrap gap-0 border-b border-line"
      aria-label="Catalogue sections"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const Icon = TAB_ICONS[tab.id] ?? BookOpen;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            onClick={() => tab.enabled && onChange(tab.id)}
            className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              !tab.enabled
                ? 'cursor-not-allowed border-transparent text-muted/45'
                : active
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted hover:text-ink'
            }`}
            title={!tab.enabled ? 'Coming soon' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

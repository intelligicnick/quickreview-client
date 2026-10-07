import type { LucideIcon } from 'lucide-react';
import { useLocationContext } from '../lib/location-context';

type Props = {
  title: string;
  tagline: string;
  icon: LucideIcon;
  bullets: string[];
  pathLabel: string;
};

export function ProductPage({ title, tagline, icon: Icon, bullets, pathLabel }: Props) {
  const { selected } = useLocationContext();

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-sm text-muted">{tagline}</p>
        </div>
      </div>
      {selected ? (
        <p className="mt-4 text-sm text-muted">
          Working on <span className="font-semibold text-ink">{selected.name}</span>. Public page:{' '}
          <span className="font-mono text-ink">{pathLabel}</span>
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-paper px-3 py-2 text-sm text-muted">
          Select a location at the top to attach this product to a shop.
        </p>
      )}
      <ul className="mt-6 space-y-3">
        {bullets.map((item) => (
          <li key={item} className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/80 p-6 text-center">
        <p className="font-semibold">Building this module next</p>
        <p className="mt-1 text-sm text-muted">Navigation is ready so your panel layout stays stable.</p>
      </div>
    </div>
  );
}

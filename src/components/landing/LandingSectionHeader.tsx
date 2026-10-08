type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
};

export function LandingSectionHeader({ eyebrow, title, subtitle, align = 'center' }: Props) {
  const alignClass = align === 'center' ? 'text-center mx-auto max-w-2xl' : 'text-left max-w-xl';

  return (
    <header className={alignClass}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      ) : null}
      <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>
      ) : null}
    </header>
  );
}

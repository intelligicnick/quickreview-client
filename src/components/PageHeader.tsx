import type { ReactNode } from 'react';
import { StatusPill, type StatusPillVariant } from './ui/StatusPill';

type PageHeaderProps = {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: { variant: StatusPillVariant; label?: string };
  actions?: ReactNode;
};

export function PageHeader({ breadcrumb, title, description, status, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? (
          <p className="mb-2 text-xs font-medium text-muted">{breadcrumb}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {status ? <StatusPill variant={status.variant} label={status.label} /> : null}
        </div>
        {description ? <p className="mt-1 max-w-2xl text-sm text-body">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

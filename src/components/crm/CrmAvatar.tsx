import { initialsFromName } from '../../lib/initials';

export function CrmAvatar({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-dark ${className}`}
      aria-hidden
    >
      {initialsFromName(name)}
    </span>
  );
}

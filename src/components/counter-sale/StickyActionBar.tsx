import { IconArrowRight } from './icons';

type StickyActionBarProps = {
  disabled: boolean;
  busy?: boolean;
  hint?: string;
  onAction: () => void;
  label?: string;
  variant?: 'primary' | 'dark';
  showArrow?: boolean;
};

export function StickyActionBar({
  disabled,
  busy = false,
  hint,
  onAction,
  label = 'Link & activate',
  variant = 'primary',
  showArrow = true,
}: StickyActionBarProps) {
  const active = !disabled && !busy;

  let btnClass = 'cursor-not-allowed bg-[#E3E8EF] text-[#5B6474]';
  if (active && variant === 'dark') btnClass = 'bg-[#0F172A] text-white';
  else if (active) btnClass = 'bg-[#1A5FD6] text-white';

  return (
    <footer
      className="shrink-0 border-t border-[#E3E8EF] bg-white px-4 pt-3"
      style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        disabled={disabled || busy}
        onClick={onAction}
        className={`flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-base font-semibold cs-focus ${btnClass}`}
      >
        {busy ? 'Linking…' : label}
        {showArrow && !busy ? <IconArrowRight className="h-5 w-5" /> : null}
      </button>
      {hint ? (
        <p className="mt-2 text-center text-xs leading-relaxed text-[#5B6474]">{hint}</p>
      ) : null}
    </footer>
  );
}

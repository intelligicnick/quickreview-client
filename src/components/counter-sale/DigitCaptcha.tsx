import { normalizeCounterSalePin } from '../../lib/counter-sale-pin';

type DigitCaptchaProps = {
  code: string;
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  id?: string;
  digitCount?: number;
  label?: string;
};

export function DigitCaptcha({
  code,
  value,
  onChange,
  onRefresh,
  id = 'login-digit-captcha',
  digitCount = 5,
  label,
}: DigitCaptchaProps) {
  const digits = code.padStart(digitCount, '0').split('');
  const resolvedLabel = label ?? `Type the ${digitCount} digits shown`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#3A4352]">Security check</p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded px-1 text-sm font-semibold text-[#1A5FD6] cs-focus"
          >
            New code
          </button>
        ) : null}
      </div>
      <div
        className="flex flex-wrap justify-center gap-1.5 rounded-[14px] border border-[#E3E8EF] bg-[#F1F6FE] px-3 py-4"
        aria-hidden
      >
        {digits.map((d, i) => (
          <span
            key={i}
            className="flex h-11 w-9 items-center justify-center rounded-[10px] bg-white text-xl font-bold text-[#0F172A] shadow-sm sm:h-12 sm:w-10 sm:text-2xl"
          >
            {d}
          </span>
        ))}
      </div>
      <label className="block text-sm font-medium text-[#3A4352]" htmlFor={id}>
        {resolvedLabel}
      </label>
      <input
        id={id}
        className="cs-field cs-mono w-full py-3 text-center text-[20px] tracking-[0.35em] sm:text-[22px] sm:tracking-[0.45em]"
        value={value}
        onChange={(e) => onChange(normalizeCounterSalePin(e.target.value))}
        inputMode="numeric"
        autoComplete="off"
        maxLength={digitCount}
        pattern={`\\d{${digitCount}}`}
        required
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-[#5B6474]">
        Enter all {digitCount} digits exactly as shown above.
      </p>
    </div>
  );
}

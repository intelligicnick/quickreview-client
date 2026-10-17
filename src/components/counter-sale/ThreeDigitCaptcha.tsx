import { normalizeCounterSalePin } from '../../lib/counter-sale-pin';

type ThreeDigitCaptchaProps = {
  code: string;
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  id?: string;
  label?: string;
};

export function ThreeDigitCaptcha({
  code,
  value,
  onChange,
  onRefresh,
  id = 'login-captcha',
  label = 'Type the 3 digits shown',
}: ThreeDigitCaptchaProps) {
  const digits = code.padStart(3, '0').split('');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#3A4352]">Security check</p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="text-sm font-semibold text-[#1A5FD6] cs-focus rounded px-1"
          >
            New code
          </button>
        ) : null}
      </div>
      <div
        className="flex justify-center gap-2 rounded-[14px] border border-[#E3E8EF] bg-[#F1F6FE] px-4 py-5"
        aria-hidden
      >
        {digits.map((d, i) => (
          <span
            key={i}
            className="flex h-12 w-10 items-center justify-center rounded-[12px] bg-white text-2xl font-bold tracking-tight text-[#0F172A] shadow-sm"
          >
            {d}
          </span>
        ))}
      </div>
      <label className="block text-sm font-medium text-[#3A4352]" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="cs-field cs-mono w-full py-3 text-center text-[22px] tracking-[0.45em]"
        value={value}
        onChange={(e) => onChange(normalizeCounterSalePin(e.target.value))}
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        pattern="\d{3}"
        required
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-[#5B6474]">
        Enter the three digits exactly as shown above.
      </p>
    </div>
  );
}

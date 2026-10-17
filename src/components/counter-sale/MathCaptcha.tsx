import { normalizeMathCaptchaAnswer, type MathCaptchaChallenge } from '../../lib/login-math-captcha';

type MathCaptchaProps = {
  challenge: MathCaptchaChallenge;
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  id?: string;
};

export function MathCaptcha({
  challenge,
  value,
  onChange,
  onRefresh,
  id = 'login-math-captcha',
}: MathCaptchaProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#3A4352]">Verification</p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded px-1 text-sm font-semibold text-[#1A5FD6] cs-focus"
          >
            New puzzle
          </button>
        ) : null}
      </div>
      <div
        className="flex items-center justify-center gap-3 rounded-[14px] border border-[#E3E8EF] bg-[#F4F6FA] px-4 py-4"
        aria-hidden
      >
        <span className="text-2xl font-bold tabular-nums text-[#0F172A]">{challenge.left}</span>
        <span className="text-xl font-semibold text-[#5B6474]">+</span>
        <span className="text-2xl font-bold tabular-nums text-[#0F172A]">{challenge.right}</span>
        <span className="text-xl font-semibold text-[#5B6474]">=</span>
        <span className="text-2xl font-bold text-[#1A5FD6]">?</span>
      </div>
      <label className="block text-sm font-medium text-[#3A4352]" htmlFor={id}>
        Your answer
      </label>
      <input
        id={id}
        className="cs-field cs-mono w-full py-3 text-center text-[22px] tracking-[0.2em]"
        value={value}
        onChange={(e) => onChange(normalizeMathCaptchaAnswer(e.target.value))}
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        required
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-xs text-[#5B6474]">
        Solve the addition to confirm you are not a bot.
      </p>
    </div>
  );
}

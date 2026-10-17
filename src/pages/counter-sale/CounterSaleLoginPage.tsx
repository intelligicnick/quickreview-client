import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MathCaptcha } from '../../components/counter-sale/MathCaptcha';
import { newMathCaptcha } from '../../lib/login-math-captcha';
import {
  COUNTER_SALE_PIN_LENGTH,
  COUNTER_SALE_PIN_PATTERN,
  normalizeCounterSalePin,
} from '../../lib/counter-sale-pin';
import {
  counterSaleApi,
  CounterSaleApiError,
  getCounterSaleToken,
  setCounterSaleToken,
} from '../../lib/counter-sale-api';

export function CounterSaleLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [captcha, setCaptcha] = useState(() => newMathCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (getCounterSaleToken()) {
    return <Navigate to="/counter-sale/link" replace />;
  }

  const captchaOk = captchaAnswer === captcha.answer;
  const pinOk = COUNTER_SALE_PIN_PATTERN.test(pin);
  const canSubmit = captchaOk && pinOk && username.trim().length >= 3 && !busy;

  function refreshCaptcha() {
    setCaptcha(newMathCaptcha());
    setCaptchaAnswer('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!captchaOk) {
      setError('Solve the addition puzzle correctly.');
      refreshCaptcha();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await counterSaleApi<{ accessToken: string }>('/api/counter-sale/auth/login', {
        method: 'POST',
        body: { username: username.trim(), pin },
      });
      setCounterSaleToken(data.accessToken);
      navigate('/counter-sale/link', { replace: true });
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Sign in failed');
      refreshCaptcha();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A]">Sign in</h1>
        <p className="mt-2 text-base text-[#5B6474]">
          Solve the quick check, then enter your username and {COUNTER_SALE_PIN_LENGTH}-digit PIN.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-[14px] bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 space-y-5 rounded-[18px] border border-[#E3E8EF] bg-white p-4">
        <MathCaptcha
          challenge={captcha}
          value={captchaAnswer}
          onChange={setCaptchaAnswer}
          onRefresh={refreshCaptcha}
        />

        <label className="block text-sm font-medium text-[#3A4352]">
          Username
          <input
            className="cs-field mt-2 w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
          />
        </label>

        <label className="block text-sm font-medium text-[#3A4352]">
          {COUNTER_SALE_PIN_LENGTH}-digit PIN
          <input
            className="cs-field cs-mono mt-2 w-full py-3 text-center text-[22px] tracking-[0.45em]"
            value={pin}
            onChange={(e) => setPin(normalizeCounterSalePin(e.target.value))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{5}"
            maxLength={COUNTER_SALE_PIN_LENGTH}
            required
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-14 w-full rounded-[14px] text-base font-semibold cs-focus ${
            canSubmit ? 'bg-[#1A5FD6] text-white' : 'cursor-not-allowed bg-[#E3E8EF] text-[#5B6474]'
          }`}
        >
          {busy ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

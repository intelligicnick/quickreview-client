export type MathCaptchaChallenge = {
  left: number;
  right: number;
  answer: string;
};

export function newMathCaptcha(): MathCaptchaChallenge {
  const left = Math.floor(1 + Math.random() * 9);
  const right = Math.floor(1 + Math.random() * 9);
  return { left, right, answer: String(left + right) };
}

export function normalizeMathCaptchaAnswer(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 2);
}

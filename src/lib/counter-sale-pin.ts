export const COUNTER_SALE_PIN_LENGTH = 3;

export const COUNTER_SALE_PIN_PATTERN = /^\d{3}$/;

export function normalizeCounterSalePin(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, COUNTER_SALE_PIN_LENGTH);
}

export function randomCounterSalePin(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function newLoginCaptcha(): string {
  return randomCounterSalePin();
}

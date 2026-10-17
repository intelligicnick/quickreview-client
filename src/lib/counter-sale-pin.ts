export const COUNTER_SALE_PIN_LENGTH = 5;

export const COUNTER_SALE_PIN_PATTERN = /^\d{5}$/;

export function normalizeCounterSalePin(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, COUNTER_SALE_PIN_LENGTH);
}

export function randomCounterSalePin(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}


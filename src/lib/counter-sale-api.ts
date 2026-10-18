import type { ApiFailure, ApiSuccess } from './types';

const STORAGE_KEY = 'counter_sale_access_token';
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class CounterSaleApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getCounterSaleToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCounterSaleToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function takeCounterSaleSessionTicketFromQuery(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ticket = params.get('ticket')?.trim();
  if (!ticket) return null;
  params.delete('ticket');
  const rest = params.toString();
  const path = window.location.pathname + (rest ? `?${rest}` : '');
  window.history.replaceState(null, '', path);
  return ticket;
}

export async function redeemCounterSaleSessionTicket(ticket: string): Promise<string> {
  const data = await counterSaleApi<{ accessToken: string }>('/api/counter-sale/auth/session', {
    method: 'POST',
    body: { ticket },
  });
  return data.accessToken;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
};

export async function counterSaleApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const token = getCounterSaleToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiSuccess<T> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload && payload.success === false ? payload.error.message : response.statusText;
    const code = payload && payload.success === false ? payload.error.code : 'REQUEST_FAILED';
    throw new CounterSaleApiError(message, response.status, code);
  }

  return payload.data;
}

/** Admin super-user token for counter-sale provision/search endpoints. */
export async function counterSaleProvisionApi<T>(
  path: string,
  adminAccessToken: string | null,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (adminAccessToken) headers.Authorization = `Bearer ${adminAccessToken}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiSuccess<T> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload && payload.success === false ? payload.error.message : response.statusText;
    const code = payload && payload.success === false ? payload.error.code : 'REQUEST_FAILED';
    throw new CounterSaleApiError(message, response.status, code);
  }

  return payload.data;
}

import type { ApiFailure, ApiSuccess } from './types';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retry = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && retry && path !== '/api/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) return api<T>(path, { ...options, retry: false });
  }

  let payload: ApiSuccess<T> | ApiFailure | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload && payload.success === false ? payload.error.message : response.statusText;
    const code = payload && payload.success === false ? payload.error.code : 'REQUEST_FAILED';
    throw new ApiError(message, response.status, code);
  }

  return payload.data;
}

export async function apiForm<T>(path: string, form: FormData, options: { method?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'POST',
    headers,
    credentials: 'include',
    body: form,
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
    throw new ApiError(message, response.status, code);
  }

  return payload.data;
}

export async function apiBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    throw new ApiError(response.statusText, response.status, 'REQUEST_FAILED');
  }
  return response.blob();
}

export async function tryRefresh(timeoutMs = 6000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      credentials: 'include',
      body: '{}',
      signal: controller.signal,
    });

    let payload: ApiSuccess<{ accessToken: string }> | ApiFailure | undefined;
    try {
      payload = (await response.json()) as ApiSuccess<{ accessToken: string }> | ApiFailure;
    } catch {
      payload = undefined;
    }

    if (!response.ok || !payload || payload.success === false) {
      setAccessToken(null);
      return false;
    }

    setAccessToken(payload.data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

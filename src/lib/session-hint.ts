const KEY = 'qr.sessionHint';

export function markSessionHint(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Private mode / blocked storage — ignore.
  }
}

export function clearSessionHint(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function hasSessionHint(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

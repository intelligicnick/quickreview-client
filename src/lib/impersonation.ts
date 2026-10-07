const KEY = 'qr_admin_resume';

export type AdminResume = {
  resumeToken: string;
  actorName: string;
  actorEmail: string;
};

export function readAdminResume(): AdminResume | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminResume;
    if (!parsed?.resumeToken || !parsed.actorEmail) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAdminResume(value: AdminResume): void {
  sessionStorage.setItem(KEY, JSON.stringify(value));
}

export function clearAdminResume(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Ignore storage failures in private browsing.
  }
}

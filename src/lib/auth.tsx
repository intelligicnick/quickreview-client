import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken, tryRefresh } from './api';
import { clearAdminResume, readAdminResume, writeAdminResume, type AdminResume } from './impersonation';
import type { PublicUser } from './types';

type AuthContextValue = {
  user: PublicUser | null;
  ready: boolean;
  impersonation: { actorName: string; actorEmail: string } | null;
  setSession: (user: PublicUser, accessToken: string) => void;
  clearSession: () => void;
  rememberImpersonation: (resume: AdminResume) => void;
  forgetImpersonation: () => void;
  exitImpersonation: () => Promise<PublicUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function homePath(user: PublicUser): string {
  if (!user.emailVerified) return '/verify-email';
  if (user.isSuperAdmin) return '/admin';
  return '/app';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [resume, setResume] = useState<AdminResume | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await tryRefresh();
      if (ok && !cancelled) {
        try {
          const me = await api<PublicUser>('/api/auth/me');
          if (cancelled) return;
          if (me.isSuperAdmin) {
            clearAdminResume();
            setResume(null);
          } else {
            setResume(readAdminResume());
          }
          setUser(me);
        } catch {
          setAccessToken(null);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const impersonation =
      resume && user && !user.isSuperAdmin
        ? { actorName: resume.actorName, actorEmail: resume.actorEmail }
        : null;

    return {
      user,
      ready,
      impersonation,
      setSession: (next, token) => {
        if (next.isSuperAdmin) {
          clearAdminResume();
          setResume(null);
        }
        setAccessToken(token);
        setUser(next);
      },
      clearSession: () => {
        clearAdminResume();
        setResume(null);
        setAccessToken(null);
        setUser(null);
      },
      rememberImpersonation: (next) => {
        writeAdminResume(next);
        setResume(next);
      },
      forgetImpersonation: () => {
        clearAdminResume();
        setResume(null);
      },
      exitImpersonation: async () => {
        const stored = readAdminResume();
        if (!stored) {
          clearAdminResume();
          setResume(null);
          setAccessToken(null);
          setUser(null);
          return null;
        }
        const data = await api<{ user: PublicUser; accessToken: string }>('/api/auth/resume-admin', {
          method: 'POST',
          auth: false,
          body: { token: stored.resumeToken },
        });
        clearAdminResume();
        setResume(null);
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data.user;
      },
    };
  }, [user, ready, resume]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

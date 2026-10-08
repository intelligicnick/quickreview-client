import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { api, setAccessToken, tryRefresh } from './api';
import { clearAdminResume, readAdminResume, writeAdminResume, type AdminResume } from './impersonation';
import type { PublicUser } from './types';

type AuthContextValue = {
  user: PublicUser | null;
  ready: boolean;
  impersonation: { actorName: string; actorEmail: string } | null;
  setSession: (user: PublicUser, accessToken: string) => void;
  clearSession: () => void;
  signOut: () => Promise<void>;
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

/** Routes that can render before session restore (marketing, auth forms, public guest pages). */
function canPaintBeforeAuth(pathname: string): boolean {
  if (pathname === '/') return true;
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) return true;
  return /^\/(r|q|c|go|menu|quick-revisit)\//.test(pathname);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [resume, setResume] = useState<AdminResume | null>(null);
  const restoreGenRef = useRef(0);

  function invalidateRestore() {
    restoreGenRef.current += 1;
  }

  function applyClearSession() {
    invalidateRestore();
    clearAdminResume();
    setResume(null);
    setAccessToken(null);
    setUser(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const gen = restoreGenRef.current;
      const ok = await tryRefresh();
      if (!ok || cancelled || gen !== restoreGenRef.current) return;
      try {
        const me = await api<PublicUser>('/api/auth/me');
        if (cancelled || gen !== restoreGenRef.current) return;
        if (me.isSuperAdmin) {
          clearAdminResume();
          setResume(null);
        } else {
          setResume(readAdminResume());
        }
        setUser(me);
      } catch {
        if (gen === restoreGenRef.current) setAccessToken(null);
      }
    }

    const pathname = window.location.pathname;
    const paintFirst = canPaintBeforeAuth(pathname);

    if (paintFirst) {
      setReady(true);
      if (pathname === '/') {
        const defer = () => {
          if (!cancelled) void restoreSession();
        };
        if (typeof requestIdleCallback === 'function') {
          const id = requestIdleCallback(defer, { timeout: 3000 });
          return () => {
            cancelled = true;
            cancelIdleCallback(id);
          };
        }
        const id = window.setTimeout(defer, 0);
        return () => {
          cancelled = true;
          clearTimeout(id);
        };
      }
      void restoreSession();
      return () => {
        cancelled = true;
      };
    }

    void restoreSession().finally(() => {
      if (!cancelled) setReady(true);
    });
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
        flushSync(() => applyClearSession());
      },
      signOut: async () => {
        invalidateRestore();
        try {
          await api('/api/auth/logout', { method: 'POST', auth: false });
        } catch {
          // Cookie cleared locally in applyClearSession either way.
        }
        flushSync(() => applyClearSession());
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

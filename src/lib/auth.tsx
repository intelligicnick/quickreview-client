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
import { api, getAccessToken, setAccessToken, tryRefresh } from './api';
import { clearAdminResume, readAdminResume, writeAdminResume, type AdminResume } from './impersonation';
import { clearSessionHint, hasSessionHint, markSessionHint } from './session-hint';
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

function isAuthFormPath(pathname: string): boolean {
  return ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);
}

function isPublicGuestPath(pathname: string): boolean {
  return /^\/(r|q|c|go|menu|quick-revisit)\//.test(pathname);
}

/**
 * Only auth forms may silently restore (e.g. "already signed in" on /login).
 * Landing (/) never calls refresh — avoids cookie restore → auto redirect to /admin.
 */
function shouldRestoreOnAuthForm(pathname: string): boolean {
  return hasSessionHint() && isAuthFormPath(pathname);
}

function isProtectedAppPath(pathname: string): boolean {
  return (
    pathname.startsWith('/app') ||
    pathname.startsWith('/admin') ||
    pathname === '/verify-email'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [resume, setResume] = useState<AdminResume | null>(null);
  const restoreGenRef = useRef(0);
  const restorePromiseRef = useRef<Promise<void> | null>(null);

  function invalidateRestore() {
    restoreGenRef.current += 1;
    restorePromiseRef.current = null;
  }

  function applyClearSession() {
    invalidateRestore();
    clearSessionHint();
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
        markSessionHint();
        if (me.isSuperAdmin) {
          clearAdminResume();
          setResume(null);
        } else {
          setResume(readAdminResume());
        }
        setUser(me);
      } catch {
        if (gen === restoreGenRef.current) {
          setAccessToken(null);
          clearSessionHint();
        }
      }
    }

    function ensureSessionRestore(): Promise<void> {
      if (restorePromiseRef.current) return restorePromiseRef.current;
      restorePromiseRef.current = restoreSession().finally(() => {
        restorePromiseRef.current = null;
      });
      return restorePromiseRef.current;
    }

    const pathname = window.location.pathname;
    const marketingOrGuest =
      pathname === '/' || isAuthFormPath(pathname) || isPublicGuestPath(pathname);

    if (marketingOrGuest) {
      setReady(true);
      if (shouldRestoreOnAuthForm(pathname)) {
        void ensureSessionRestore();
      }
      return () => {
        cancelled = true;
      };
    }

    if (isProtectedAppPath(pathname)) {
      void ensureSessionRestore().finally(() => {
        if (!cancelled) setReady(true);
      });
      return () => {
        cancelled = true;
      };
    }

    void ensureSessionRestore().finally(() => {
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
        markSessionHint();
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
        const hadSession = hasSessionHint();
        invalidateRestore();
        if (hadSession) {
          try {
            await api('/api/auth/logout', {
              method: 'POST',
              auth: Boolean(getAccessToken()),
              retry: false,
            });
          } catch {
            // Idempotent — cookie cleared locally below either way.
          }
        }
        clearSessionHint();
        flushSync(() => {
          clearAdminResume();
          setResume(null);
          setAccessToken(null);
          setUser(null);
        });
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
        markSessionHint();
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

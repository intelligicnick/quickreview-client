import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { initialsFromName } from '../lib/initials';

export function AppAccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function logout() {
    await signOut();
    navigate('/', { replace: true });
  }

  if (!user) return null;
  const initials = initialsFromName(user.name || user.email);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-11 max-w-[14rem] items-center gap-2 rounded-[10px] border border-line bg-white px-2 py-1.5 text-left hover:bg-surface-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-brand-dark">
          {initials}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{user.name}</span>
        <ChevronDown className="h-[18px] w-[18px] shrink-0 text-muted stroke-[1.8]" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-52 rounded-[10px] border border-line bg-white py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            to="/app/settings"
            className="flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-ink hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-[18px] w-[18px] stroke-[1.8] text-muted" aria-hidden />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full min-h-10 items-center gap-2 px-3 text-left text-sm font-medium text-ink hover:bg-surface-2"
            onClick={() => void logout()}
          >
            <LogOut className="h-[18px] w-[18px] stroke-[1.8] text-muted" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

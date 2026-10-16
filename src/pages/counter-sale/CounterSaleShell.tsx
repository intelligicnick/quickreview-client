import { LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from '../../components/BrandMark';
import {
  getCounterSaleToken,
  setCounterSaleToken,
  takeCounterSaleTokenFromHash,
} from '../../lib/counter-sale-api';

export function CounterSaleShell() {
  const navigate = useNavigate();
  const signedIn = Boolean(getCounterSaleToken());

  useEffect(() => {
    const token = takeCounterSaleTokenFromHash();
    if (!token) return;
    setCounterSaleToken(token);
    navigate('/counter-sale/link', { replace: true });
  }, [navigate]);

  function logout() {
    setCounterSaleToken(null);
    navigate('/counter-sale/login', { replace: true });
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="font-display text-sm font-bold">Counter sale</span>
        </div>
        {signedIn ? (
          <button type="button" onClick={logout} className="flex items-center gap-1 text-sm text-muted">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        ) : null}
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

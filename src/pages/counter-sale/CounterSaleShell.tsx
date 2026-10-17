import { LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from '../../components/BrandMark';
import { getCounterSaleToken, setCounterSaleToken } from '../../lib/counter-sale-api';

export function CounterSaleShell() {
  const navigate = useNavigate();
  const signedIn = Boolean(getCounterSaleToken());

  function logout() {
    setCounterSaleToken(null);
    navigate('/counter-sale/login', { replace: true });
  }

  return (
    <div className="counter-sale-shell flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-[#E3E8EF] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-sm font-bold text-[#0F172A]">Counter sale</span>
        </div>
        {signedIn ? (
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 text-sm font-medium text-[#5B6474] cs-focus"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

import { Outlet, useNavigate } from 'react-router-dom';
import { BrandIcon } from '../../components/BrandIcon';
import { IconSignOut } from '../../components/counter-sale/icons';
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
      <header className="flex shrink-0 items-center justify-between border-b border-[#E3E8EF] bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandIcon className="h-8 w-8 rounded-[8px]" />
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight text-[#0F172A]">QuickReview</p>
            <p className="text-xs font-medium text-[#5B6474]">Counter sale</p>
          </div>
        </div>
        {signedIn ? (
          <button
            type="button"
            onClick={logout}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[#5B6474] cs-focus hover:bg-[#F4F6FA]"
            aria-label="Sign out"
          >
            <IconSignOut />
          </button>
        ) : null}
      </header>
      <div className="mx-auto flex w-full max-w-[390px] min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';

export function CommerceSectionSwitch() {
  return (
    <div
      className="inline-flex gap-0.5 rounded-full bg-[#EEF2F7] p-1"
      role="group"
      aria-label="QuickCommerce sections"
    >
      <NavLink
        to="/app/quickcommerce"
        end
        className={({ isActive }) =>
          cn(
            'inline-flex shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold',
            isActive ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
          )
        }
      >
        Catalogue
      </NavLink>
      <NavLink
        to="/app/quickcommerce/revisit"
        className={({ isActive }) =>
          cn(
            'inline-flex shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold',
            isActive ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink',
          )
        }
      >
        Quick Revisit
      </NavLink>
    </div>
  );
}

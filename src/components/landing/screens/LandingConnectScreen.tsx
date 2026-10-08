import { Phone, User } from 'lucide-react';
import { BrandMark } from '../../BrandMark';

export function LandingConnectScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-brand/5 to-white pt-3">
      <div className="px-3 text-center">
        <BrandMark className="mx-auto !h-6 max-w-[6.5rem]" />
      </div>
      <div className="mx-3 mt-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <User className="h-7 w-7" />
        </div>
        <p className="mt-3 text-center font-display text-sm font-bold">Rajesh Kumar</p>
        <p className="text-center text-[10px] text-muted">Sunrise Café · Owner</p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Phone className="h-3 w-3" />
          +91 98765 43210
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-brand py-2 text-[11px] font-semibold text-white"
          tabIndex={-1}
        >
          Save contact
        </button>
      </div>
    </div>
  );
}

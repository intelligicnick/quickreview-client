import { StickyActionBar } from './StickyActionBar';
import { IconCheck } from './icons';

export type LinkSuccessSummary = {
  qrCode: string;
  businessName: string;
  service: 'review' | 'menu';
};

function serviceLabel(service: 'review' | 'menu') {
  return service === 'review' ? 'QuickReview' : 'QuickCommerce';
}

export function LinkSuccess({ summary, onLinkAnother }: { summary: LinkSuccessSummary; onLinkAnother: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-[84px] w-[84px] items-center justify-center" aria-hidden>
            <span className="absolute inset-0 rounded-full border-2 border-[#0F7B4B]/25" />
            <span className="absolute inset-2 rounded-full border-2 border-[#0F7B4B]/45" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F4EC] text-[#0F7B4B]">
              <IconCheck className="h-7 w-7" />
            </span>
          </div>
          <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em] text-[#0F172A]">Standee is live</h1>
          <p className="mt-2 max-w-[280px] text-base leading-relaxed text-[#5B6474]">
            Ask the customer to scan it once to test.
          </p>
        </div>

        <dl className="mt-8 rounded-[18px] border border-[#E3E8EF] bg-white p-4">
          <div className="border-b border-[#E3E8EF] py-3 first:pt-0 last:border-0 last:pb-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-[#5B6474]">QR code</dt>
            <dd className="mt-1 font-mono text-lg font-medium tracking-[0.18em] text-[#0F172A]">{summary.qrCode}</dd>
          </div>
          <div className="border-b border-[#E3E8EF] py-3 last:border-0 last:pb-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-[#5B6474]">Business</dt>
            <dd className="mt-1 text-[15px] font-semibold text-[#0F172A]">{summary.businessName}</dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-[#5B6474]">Service</dt>
            <dd className="mt-1 text-[15px] font-semibold text-[#0F172A]">{serviceLabel(summary.service)}</dd>
          </div>
        </dl>
      </div>

      <StickyActionBar
        disabled={false}
        label="Link another standee"
        variant="dark"
        showArrow={false}
        onAction={onLinkAnother}
      />
    </div>
  );
}

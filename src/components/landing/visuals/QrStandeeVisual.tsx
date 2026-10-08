import { QrCodePreview } from '../../QrCodePreview';

export function QrStandeeVisual() {
  return (
    <div className="relative flex justify-center" aria-hidden>
      <div className="absolute -left-4 top-8 h-24 w-24 rounded-full bg-brand/15 blur-xl" />
      <div className="relative rounded-2xl border border-line bg-white p-6 shadow-[0_16px_48px_rgba(27,35,51,0.1)]">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-muted">Table standee</p>
        <div className="mt-3 flex justify-center">
          <QrCodePreview value="https://quickreview.co.in/r/demo" size={112} label="Demo review QR" />
        </div>
        <p className="mt-3 text-center font-display text-sm font-bold text-ink">Scan for reviews</p>
        <p className="text-center text-[11px] text-muted">Sunrise Café</p>
      </div>
    </div>
  );
}

import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LockedQrGate } from './LockedQrGate';
import { QrCodePreview } from './QrCodePreview';

export type QrProductCardProps = {
  title: string;
  purpose: string;
  publicUrl: string;
  publicPath: string;
  unlocked: boolean;
  statusLabel: string;
  manageHref: string;
  manageLabel?: string;
  /** Label on the unlock pill when locked (defaults to review wording). */
  unlockLabel?: string;
  onUnlockClick?: () => void;
  unlockTo?: string;
};

function downloadQrSvg(container: HTMLElement | null, filename: string) {
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.svg`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function QrProductCard({
  title,
  purpose,
  publicUrl,
  publicPath,
  unlocked,
  statusLabel,
  manageHref,
  manageLabel = 'Manage',
  unlockLabel,
  onUnlockClick,
  unlockTo,
}: QrProductCardProps) {
  const [copied, setCopied] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const safeFilename = title.toLowerCase().replace(/\s+/g, '-');

  const defaultUnlock =
    title.toLowerCase().includes('commerce')
      ? 'Select a plan to unlock QR and Commerce link'
      : title.toLowerCase().includes('connect')
        ? 'Select a plan to unlock QR and Connect link'
        : 'Select a plan to unlock QR and Review link';

  async function copyLink() {
    if (!unlocked) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="flex min-w-[17rem] flex-1 flex-col rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted">{purpose}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            unlocked ? 'bg-brand/10 text-brand-dark' : 'bg-violet-50 text-violet-800'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {unlocked ? (
        <>
          <div ref={qrWrapRef} className="relative mt-4 flex justify-center">
            <QrCodePreview value={publicUrl} size={140} label={`${title} QR code`} />
          </div>
          <p className="mt-3 break-all font-mono text-xs text-muted">{publicUrl}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold hover:border-brand/40"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
            <button
              type="button"
              onClick={() => downloadQrSvg(qrWrapRef.current, safeFilename)}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-xs font-semibold"
              title="Download SVG"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <LockedQrGate
          className="mt-4"
          unlockLabel={unlockLabel ?? defaultUnlock}
          onUnlockClick={onUnlockClick}
          unlockTo={unlockTo}
        />
      )}

      <Link
        to={manageHref}
        className="mt-4 text-center text-xs font-semibold text-brand hover:text-brand-dark"
      >
        {manageLabel} →
      </Link>
    </article>
  );
}

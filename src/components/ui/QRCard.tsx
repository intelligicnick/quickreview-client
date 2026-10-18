import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LockedQrGate } from '../LockedQrGate';
import { QrCodePreview } from '../QrCodePreview';
import { IconButton } from './IconButton';
import { StatusPill } from './StatusPill';
import { Button } from './Button';

export type QRCardProps = {
  title: string;
  subtitle: string;
  publicUrl: string;
  publicPath: string;
  unlocked: boolean;
  manageHref: string;
  manageLabel?: string;
};

function downloadQrPng(container: HTMLElement | null, filename: string) {
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const serialized = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const svgUrl = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }));
  img.onload = () => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
    URL.revokeObjectURL(svgUrl);
  };
  img.src = svgUrl;
}

export function QRCard({
  title,
  subtitle,
  publicUrl,
  publicPath,
  unlocked,
  manageHref,
  manageLabel = 'Manage',
}: QRCardProps) {
  const [copied, setCopied] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const safeFilename = title.toLowerCase().replace(/\s+/g, '-');
  const displayUrl = publicUrl.replace(/^https?:\/\//, '');

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
    <article className="flex min-w-[17rem] flex-1 flex-col rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-bold text-ink">{title}</h3>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
        {unlocked ? <StatusPill variant="active" label="Active" /> : null}
      </div>

      {unlocked ? (
        <>
          <div ref={qrWrapRef} className="mt-4 flex justify-center">
            <QrCodePreview value={publicUrl} size={200} label={`${title} QR code`} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{displayUrl}</code>
            <IconButton aria-label="Copy link" onClick={() => void copyLink()}>
              {copied ? <Check className="h-[18px] w-[18px] text-brand" /> : <Copy className="h-[18px] w-[18px]" />}
            </IconButton>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadQrPng(qrWrapRef.current, safeFilename)}
            >
              <Download className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
              Download PNG
            </Button>
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-2 rounded-[10px] bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Open page
              <ExternalLink className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
            </a>
          </div>
        </>
      ) : (
        <LockedQrGate className="mt-4" unlockTo="/app/subscription" />
      )}

      <Link to={manageHref} className="mt-4 text-sm font-semibold text-brand hover:text-brand-dark">
        {manageLabel} →
      </Link>
    </article>
  );
}

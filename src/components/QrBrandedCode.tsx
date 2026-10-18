import QRCode from 'react-qr-code';

const MARK_RATIO = 0.17;

type QrBrandedCodeProps = {
  value: string;
  size: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
};

/** QR with transparent center Q mark (level H for logo clearance). */
export function QrBrandedCode({ value, size, level = 'H', className }: QrBrandedCodeProps) {
  const mark = Math.max(16, Math.round(size * MARK_RATIO));

  return (
    <div className={className ? `relative ${className}` : 'relative'}>
      <QRCode value={value} size={size} level={level} bgColor="#ffffff" fgColor="#101828" />
      <img
        src="/logo-q.png"
        alt=""
        width={mark}
        height={mark}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </div>
  );
}

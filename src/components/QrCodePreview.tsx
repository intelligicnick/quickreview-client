import QRCode from 'react-qr-code';

type QrCodePreviewProps = {
  value: string;
  size?: number;
  label?: string;
};

export function QrCodePreview({ value, size = 128, label }: QrCodePreviewProps) {
  const ariaLabel = label ?? `QR code for ${value}`;

  return (
    <div
      className="shrink-0 rounded-xl border border-line bg-white p-2"
      role="img"
      aria-label={ariaLabel}
    >
      <QRCode value={value} size={size} level="M" bgColor="#ffffff" fgColor="#0f172a" />
    </div>
  );
}

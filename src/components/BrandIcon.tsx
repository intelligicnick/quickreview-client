/** Square QuickReview “Q” mark (same asset as site favicon / PWA icon). */
export function BrandIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img
      src="/logo-q.png"
      alt=""
      width={256}
      height={256}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}

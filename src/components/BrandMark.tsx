export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Quick CRM"
      width={1024}
      height={341}
      className={`h-8 w-auto max-w-[10.5rem] object-contain object-left sm:h-9 ${className}`}
    />
  );
}

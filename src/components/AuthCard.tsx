import type { FormEvent, ReactNode } from 'react';
import { BrandMark } from './BrandMark';

export function AuthCard({
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel,
  busy,
  error,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-atmosphere flex min-h-dvh items-center justify-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-5 shadow-[0_18px_50px_rgba(27,35,51,0.08)] sm:p-8">
        <BrandMark />
        <h1 className="mt-6 text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {children}
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? 'Please wait…' : submitLabel}
          </button>
        </form>
        {footer ? <div className="mt-5 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-base outline-none ring-brand/20 focus:border-brand focus:ring-4 sm:text-sm';

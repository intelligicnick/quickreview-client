import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandMark } from '../BrandMark';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#products', label: 'Products' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            to="/login"
            className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-ink hover:bg-paper"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="text-sm font-semibold text-brand"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

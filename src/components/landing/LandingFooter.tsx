import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { GUIDE_POSTS } from '../../lib/guides';

const PRODUCT_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#advantages', label: 'Advantages' },
  { href: '/#products', label: 'Products' },
  { href: '/#refer', label: 'Refer & save 10%' },
] as const;

export function LandingFooter() {
  const featuredGuides = GUIDE_POSTS.slice(0, 3);

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <Link
              to="/"
              className="inline-flex rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_8px_24px_rgba(27,35,51,0.06)] transition hover:border-brand/25"
            >
              <BrandMark className="h-9 sm:h-10" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Google reviews, mobile menus, digital cards, and light CRM — built for shops that run on
              foot traffic.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Get started free
            </Link>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="font-medium text-ink/80 transition hover:text-brand">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Guides & blog</p>
            <p className="mt-2 text-sm text-muted">Practical playbooks for reviews, QR, and growth.</p>
            <ul className="mt-4 space-y-3 text-sm">
              {featuredGuides.map((post) => (
                <li key={post.slug}>
                  <Link
                    to={`/guides/${post.slug}`}
                    className="group block font-medium text-ink/85 transition hover:text-brand"
                  >
                    <span className="line-clamp-2">{post.title}</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {post.category} · {post.readMinutes} min read
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/guides"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              All guides
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="font-medium text-ink/80 transition hover:text-brand">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/register" className="font-medium text-ink/80 transition hover:text-brand">
                  Create account
                </Link>
              </li>
              <li>
                <Link to="/guides" className="font-medium text-ink/80 transition hover:text-brand">
                  Guides hub
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-white">
        <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} QuickReview. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

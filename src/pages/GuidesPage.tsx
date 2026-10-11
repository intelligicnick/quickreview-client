import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingSectionHeader } from '../components/landing/LandingSectionHeader';
import { GUIDE_POSTS } from '../lib/guides';

export function GuidesPage() {
  return (
    <div className="min-h-dvh bg-white text-ink">
      <LandingNav />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <LandingSectionHeader
          eyebrow="Guides & blog"
          title="Learn QuickReview step by step"
          subtitle="Short reads on Google reviews, QR setup, menus, and follow-ups — no fluff, just what works on the counter."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {GUIDE_POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/guides/${post.slug}`}
                className="flex h-full flex-col rounded-2xl border border-line bg-paper p-6 transition hover:border-brand/30 hover:shadow-[0_12px_32px_rgba(27,35,51,0.06)]"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-brand">{post.category}</span>
                <h2 className="font-display mt-2 text-lg font-extrabold tracking-tight">{post.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {post.readMinutes} min read
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <LandingFooter />
    </div>
  );
}

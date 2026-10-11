import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingNav } from '../components/landing/LandingNav';
import { getGuideBySlug } from '../lib/guides';

export function GuideArticlePage() {
  const { slug } = useParams();
  const post = slug ? getGuideBySlug(slug) : undefined;
  if (!post) return <Navigate to="/guides" replace />;

  return (
    <div className="min-h-dvh bg-white text-ink">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/guides"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All guides
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-wide text-brand">{post.category}</p>
        <h1 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-muted">{post.readMinutes} min read</p>
        <div className="prose prose-sm mt-10 max-w-none space-y-5 text-sm leading-relaxed text-ink/90 sm:text-base">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-line bg-paper px-6 py-8 text-center">
          <p className="font-display text-lg font-bold">Ready to try it on your counter?</p>
          <p className="mt-2 text-sm text-muted">Free workspace · Google import · QR in minutes</p>
          <Link
            to="/register"
            className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-ink px-6 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Get started free
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

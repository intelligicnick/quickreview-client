import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingNav } from '../components/landing/LandingNav';
import { LEGAL_DOCS, type LegalDocId } from '../lib/legal-docs';

type Props = { docId: LegalDocId };

export function LegalDocumentPage({ docId }: Props) {
  const doc = LEGAL_DOCS[docId];
  if (!doc) return <Navigate to="/" replace />;

  const otherLinks = Object.values(LEGAL_DOCS).filter((d) => d.id !== doc.id);

  return (
    <div className="min-h-dvh bg-white text-ink">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-wide text-brand">Legal</p>
        <h1 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {doc.updated}</p>
        <p className="mt-8 text-sm leading-relaxed text-ink/90 sm:text-base">{doc.intro}</p>
        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-bold text-ink">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/90 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <nav className="mt-12 rounded-2xl border border-line bg-paper px-6 py-6" aria-label="Other legal documents">
          <p className="text-sm font-semibold text-ink">Related policies</p>
          <ul className="mt-3 space-y-2 text-sm">
            {otherLinks.map((d) => (
              <li key={d.id}>
                <Link to={d.path} className="font-medium text-brand hover:underline">
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <LandingFooter />
    </div>
  );
}

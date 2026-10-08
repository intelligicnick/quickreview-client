import { Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  MessageSquare,
  QrCode,
  Sparkles,
  Star,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingPhoneSingle, LandingPhoneStack } from '../components/landing/LandingPhoneStack';

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-white text-ink">
      <LandingNav />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <div className="landing-hero-panel overflow-hidden rounded-[2rem] px-6 py-10 sm:rounded-[2.5rem] sm:px-10 sm:py-14 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
            <div className="animate-fade-up text-white">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Built for local business
              </p>
              <h1 className="font-display mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
                Grow your shop with QR, reviews, and CRM
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                Import from Google Business, publish guest pages in minutes, and manage follow-ups in
                one simple workspace — QuickReview, Quick Commerce, QuickConnect, and Quick CRM.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-ink px-6 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                >
                  Get started free
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-white/30 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See features
                </a>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <LandingPhoneStack />
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-paper py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FeatureCard
                icon={Star}
                title="QuickReview on every scan"
                description="Collect star ratings, capture private feedback, and send happy customers to Google — all from a branded guest page."
              />
              <FeatureCard
                icon={UtensilsCrossed}
                title="Quick Commerce menus"
                description="Publish a mobile menu and catalogue guests can browse from your QR — prices, veg badges, and photos included."
              />
            </div>
          </div>
        </section>

        <section id="advantages" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Advantages
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  Everything you need to look professional online and stay on top of customers — without
                  a complicated stack.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdvantageItem
                  icon={MapPin}
                  title="Smooth start"
                  description="Import your shop from Google Business Profile and pick a location to go live."
                />
                <AdvantageItem
                  icon={Clock}
                  title="Always-on guest pages"
                  description="Review, menu, and digital card links work 24/7 from the same QR codes."
                />
                <AdvantageItem
                  icon={QrCode}
                  title="Low-friction QR"
                  description="Generate and print codes for tables, counters, and standees from your dashboard."
                />
                <AdvantageItem
                  icon={MessageSquare}
                  title="CRM follow-ups"
                  description="Track customers, quotations, and reminders in Quick CRM on mobile or desktop."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-white py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Built for local business
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-ink/80">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" aria-hidden />
                Google Business import
              </li>
              <li className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-brand" aria-hidden />
                QR codes & standees
              </li>
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-brand" aria-hidden />
                Reviews & feedback
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" aria-hidden />
                Simple CRM
              </li>
            </ul>
          </div>
        </section>

        <section id="products" className="scroll-mt-20 landing-mesh py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Keep your finger on the pulse
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                See page views, star taps, and Google opens at a glance. Activate QuickReview,
                Quick Commerce, QuickConnect, QuickDesign posters, and QuickScan card capture as you
                grow.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex min-h-11 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Start free
              </Link>
            </div>
            <LandingPhoneSingle />
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Get the workspace free and start now
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">
              Create an account, import your location, and publish your first guest page today.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-ink px-8 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-ink px-4 py-12 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <BrandMark className="brightness-0 invert" />
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Quick CRM — reviews, menus, digital cards, and CRM for shops that run on foot traffic.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-semibold text-white/90">Product</p>
              <ul className="mt-3 space-y-2 text-white/60">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#products" className="hover:text-white">
                    Products
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white/90">Account</p>
              <ul className="mt-3 space-y-2 text-white/60">
                <li>
                  <Link to="/login" className="hover:text-white">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Quick CRM. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Star;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function AdvantageItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Star;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

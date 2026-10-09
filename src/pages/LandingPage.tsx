import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  IdCard,
  MapPin,
  MessageSquare,
  Palette,
  QrCode,
  Sparkles,
  Star,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { LandingHighlightCard } from '../components/landing/LandingHighlightCard';
import { LandingNav } from '../components/landing/LandingNav';
import {
  LandingPhoneDashboard,
  LandingPhoneReviewMini,
  LandingPhoneStack,
} from '../components/landing/LandingPhoneStack';
import { LandingSectionHeader } from '../components/landing/LandingSectionHeader';
import { LandingSplitSection } from '../components/landing/LandingSplitSection';
import { AnalyticsDonutVisual } from '../components/landing/visuals/AnalyticsDonutVisual';
import { MenuStackVisual } from '../components/landing/visuals/MenuStackVisual';
import { ProductFloatVisual } from '../components/landing/visuals/ProductFloatVisual';
import { QrStandeeVisual } from '../components/landing/visuals/QrStandeeVisual';
import { ReviewStarsVisual } from '../components/landing/visuals/ReviewStarsVisual';
import { StatsLineChartVisual } from '../components/landing/visuals/StatsLineChartVisual';
import {
  ConnectCardVisual,
  CrmFollowUpsVisual,
} from '../components/landing/visuals/ConnectCrmVisuals';

const HERO_STATS = [
  { value: '5 min', label: 'to go live' },
  { value: '1 QR', label: 'all guest pages' },
  { value: 'Free', label: 'workspace' },
] as const;

const STEPS = [
  {
    title: 'Import your shop',
    description: 'Pull name, hours, and location from Google Business Profile.',
  },
  {
    title: 'Print your QR',
    description: 'Reviews, menu, and digital card — routed from one code.',
  },
  {
    title: 'Follow up in CRM',
    description: 'Track leads, quotations, and reminders from your phone.',
  },
] as const;

const TRUST_ITEMS = [
  { icon: MapPin, label: 'Google import' },
  { icon: QrCode, label: 'QR codes' },
  { icon: Star, label: 'Reviews' },
  { icon: UtensilsCrossed, label: 'Menus' },
  { icon: Users, label: 'CRM' },
  { icon: Palette, label: 'Posters' },
] as const;

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
              <h1 className="font-display mt-5 text-[1.75rem] font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.85rem]">
                Turn every scan into reviews, menus, and repeat customers
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/88 sm:text-base">
                Import from Google Business, publish branded guest pages in minutes, and run
                follow-ups from one workspace — no juggling five different apps.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-brand shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition hover:bg-white/95"
                >
                  Get started free
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-white/35 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  How it works
                </a>
              </div>
              <dl className="mt-8 grid max-w-md grid-cols-3 gap-3 border-t border-white/20 pt-6 sm:max-w-lg sm:gap-4">
                {HERO_STATS.map(({ value, label }) => (
                  <div key={label}>
                    <dt className="font-display text-lg font-extrabold tracking-tight sm:text-xl">
                      {value}
                    </dt>
                    <dd className="mt-0.5 text-[11px] font-medium text-white/75 sm:text-xs">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-8 hidden animate-fade-up-delay sm:block sm:mt-10 lg:mt-0">
              <LandingPhoneStack />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-b border-line bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSectionHeader
              eyebrow="How it works"
              title="Live in three steps"
              subtitle="From Google import to printed QR and CRM follow-ups — the same flow for cafés, salons, and counters."
            />
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-line bg-paper/80 p-5 sm:p-6"
                >
                  <span
                    className="font-display inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-paper py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSectionHeader
              eyebrow="Features"
              title="Everything in one workspace"
              subtitle="Guest-facing pages and merchant tools that stay in sync — no juggling five different apps."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <LandingHighlightCard
                icon={Star}
                title="QuickReview on every scan"
                description="Collect star ratings, capture private feedback, and send happy customers to Google — all from a branded guest page."
                visual={<ReviewStarsVisual />}
              />
              <LandingHighlightCard
                icon={UtensilsCrossed}
                title="Quick Commerce menus"
                description="Publish a mobile menu and catalogue guests can browse from your QR — prices, veg badges, and photos included."
                visual={<MenuStackVisual />}
              />
              <LandingHighlightCard
                icon={IdCard}
                title="QuickConnect digital cards"
                description="Share a tap-to-save contact card from the same QR — name, phone, and role without paper business cards."
                visual={<ConnectCardVisual />}
              />
              <LandingHighlightCard
                icon={Users}
                title="Quick CRM follow-ups"
                description="Log customers, quotations, and reminders on mobile — so nothing falls through after the first visit."
                visual={<CrmFollowUpsVisual />}
              />
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSplitSection
              visual={
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:justify-start">
                  <QrStandeeVisual />
                  <LandingPhoneReviewMini />
                </div>
              }
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">QR flow</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Scan once, route every guest
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                One code on the counter or table opens the right experience — reviews, menus, or your
                digital card.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <Bullet>Guests tap stars on a branded QuickReview page</Bullet>
                <Bullet>Low ratings stay private so you can fix issues first</Bullet>
                <Bullet>4–5★ ratings can hand off to Google in one tap</Bullet>
              </ul>
            </LandingSplitSection>
          </div>
        </section>

        <section id="advantages" className="scroll-mt-20 bg-paper py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
              <div>
                <LandingSectionHeader
                  align="left"
                  eyebrow="Why us"
                  title="Advantages"
                  subtitle="Everything you need to look professional online and stay on top of customers — without a complicated stack."
                />
                <div className="mt-8 hidden lg:block">
                  <AnalyticsDonutVisual />
                </div>
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

        <section className="border-y border-line bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSectionHeader
              title="Built for local business"
              subtitle="Shops, cafés, salons, and service counters — the same simple toolkit."
            />
            <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex w-[88px] flex-col items-center gap-2 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper shadow-sm">
                    <Icon className="h-5 w-5 text-brand" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold text-ink/80">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSplitSection
              reverse
              visual={<StatsLineChartVisual />}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Analytics</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                See activity in real time
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Page views, star taps, private feedback, and Google opens — so you know what guests
                actually do after they scan.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <Bullet>Per-location dashboard at a glance</Bullet>
                <Bullet>Product status for Review, Commerce, and Connect</Bullet>
                <Bullet>Activate QuickDesign posters and QuickScan when you are ready</Bullet>
              </ul>
            </LandingSplitSection>
          </div>
        </section>

        <section id="products" className="scroll-mt-20 landing-mesh py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSplitSection
              visual={<ProductFloatVisual />}
              className="lg:items-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Products</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Five tools, one login
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                Turn on what you need today — reviews, menus, digital cards, CRM, posters, and card
                scanning — without replatforming later.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex min-h-11 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Start free
              </Link>
            </LandingSplitSection>

            <div className="mt-16 grid items-center gap-10 border-t border-white/10 pt-16 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Your dashboard in your pocket
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Operate each location from one place — alerts, quick actions, and live product
                  status.
                </p>
              </div>
              <LandingPhoneDashboard />
            </div>
          </div>
        </section>

        <section className="bg-paper py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="landing-final-cta rounded-[2rem] border border-line px-6 py-12 text-center shadow-[0_16px_48px_rgba(27,35,51,0.06)] sm:px-10 sm:py-14">
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Get the workspace free and start now
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">
                Create an account, import your location, and publish your first guest page today.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center rounded-2xl bg-ink px-8 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center rounded-2xl border border-line bg-white px-8 text-sm font-semibold text-ink transition hover:bg-paper"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink px-4 py-14 text-white sm:px-6">
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

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-muted">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
      <span>{children}</span>
    </li>
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
    <div className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand/30 hover:shadow-sm">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

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
import { LandingAiReviewShowcase } from '../components/landing/LandingAiReviewShowcase';
import { LandingGuestFlow } from '../components/landing/LandingGuestFlow';
import { LandingReferralBand } from '../components/landing/LandingReferralBand';
import { LandingReputationStats } from '../components/landing/LandingReputationStats';
import { LandingFooter } from '../components/landing/LandingFooter';

const HERO_STATS = [
  { value: '<5 min', label: 'signup to printed QR' },
  { value: 'One link', label: 'reputation · menu · contact' },
  { value: '10%', label: 'referral credit' },
] as const;

const TRUST_ITEMS = [
  { icon: MapPin, label: 'GBP sync' },
  { icon: QrCode, label: 'Counter codes' },
  { icon: Star, label: 'Reputation' },
  { icon: UtensilsCrossed, label: 'Live menu' },
  { icon: Users, label: 'Follow-ups' },
  { icon: Palette, label: 'Printables' },
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
                Built for walk-in trade
              </p>
              <h1 className="font-display mt-5 text-[1.75rem] font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.85rem]">
                Your counter is where reputation is won or lost
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/88 sm:text-base">
                Drop one code by the till. Delighted visitors get wording help for public reviews;
                frustrated ones talk to you first. Menus, tap-to-save contacts, and follow-ups share
                the same dashboard — no duct-taped stack of apps.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-brand shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition hover:bg-white/95"
                >
                  Create free workspace
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-11 items-center rounded-2xl border border-white/35 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Watch guest journey
                </a>
              </div>
              <p className="mt-4 text-xs font-medium text-white/70">
                No card to start · Pull details from Google Business Profile · Refer a neighbor for 10% off
              </p>
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
            <div className="mt-8 animate-fade-up-delay sm:mt-10 lg:mt-0">
              <LandingPhoneStack />
            </div>
          </div>
        </section>

        <LandingReputationStats />

        <section id="how-it-works" className="scroll-mt-20 border-b border-line bg-paper py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSectionHeader
              eyebrow="Guest path"
              title="What happens after someone scans"
              subtitle="A single code opens your branded page. High scores get gentle help posting online; low scores stay between you and the guest."
            />
            <LandingGuestFlow />
            <p className="mt-8 text-center text-sm text-muted">
              On your side:{' '}
              <span className="font-semibold text-ink">
                sync location → print standees → nudge leads in CRM
              </span>{' '}
              without switching tools.
            </p>
          </div>
        </section>

        <LandingAiReviewShowcase />

        <section id="features" className="scroll-mt-20 bg-paper py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSectionHeader
              eyebrow="Toolkit"
              title="Four jobs, one login"
              subtitle="Public-facing pages and back-office tools update together — you are not maintaining parallel spreadsheets and link trees."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <LandingHighlightCard
                icon={Star}
                title="Reputation capture"
                description="Star taps, optional private notes, and a smooth handoff to Google when the visit went well — on a page that looks like your brand."
                visual={<ReviewStarsVisual />}
              />
              <LandingHighlightCard
                icon={UtensilsCrossed}
                title="Commerce menu"
                description="Show today’s items, prices, and dietary tags from the same scan guests already use — ideal for counters and tables."
                visual={<MenuStackVisual />}
              />
              <LandingHighlightCard
                icon={IdCard}
                title="Connect card"
                description="Let people save your number and role in one tap — digital vCard from the QR they already have in hand."
                visual={<ConnectCardVisual />}
              />
              <LandingHighlightCard
                icon={Users}
                title="Relationship log"
                description="Quotes, callbacks, and small reminders on phone or laptop so a good first visit turns into repeat business."
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Smart routing</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                One code, the right next step
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Table tent or receipt sticker — the scan lands on your hub. Guests choose reviews, browse
                the menu, or save your contact without hunting for links.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <Bullet>Branded rating screen in seconds, no app install</Bullet>
                <Bullet>Scores below four stars trigger a private message to you</Bullet>
                <Bullet>Strong scores open Google with suggested copy they can edit</Bullet>
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
                  eyebrow="Operator edge"
                  title="Why teams stick with QuickReview"
                  subtitle="Look polished in search, respond faster on the floor, and keep relationships organized — without hiring an agency."
                />
                <div className="mt-8 hidden lg:block">
                  <AnalyticsDonutVisual />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdvantageItem
                  icon={MapPin}
                  title="Fast onboarding"
                  description="Pull hours, name, and location from Google Business Profile, then pick which products to switch on."
                />
                <AdvantageItem
                  icon={Clock}
                  title="Always live"
                  description="Guest links for ratings, menu, and vCard stay up around the clock from the codes you already printed."
                />
                <AdvantageItem
                  icon={QrCode}
                  title="Print-ready codes"
                  description="Export QR artwork for counters, menus, and packaging straight from the admin panel."
                />
                <AdvantageItem
                  icon={MessageSquare}
                  title="Human follow-through"
                  description="Notes, quotes, and ping reminders live beside your reputation tools on any device."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <LandingSectionHeader
              title="Made for neighborhood operators"
              subtitle="Retail counters, food service, grooming studios, clinics — one playbook, tuned to foot traffic."
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Pulse</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Know what the QR actually does
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Opens, star taps, quiet complaints, and public review clicks — aggregated so you can
                spot a slow week before revenue dips.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <Bullet>Location-level snapshot on mobile or desktop</Bullet>
                <Bullet>Live vs setup badges for each product module</Bullet>
                <Bullet>Layer on QuickDesign posters and QuickScan when you scale</Bullet>
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Platform</p>
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Grow the stack only when you need to
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                Begin with reputation, add menu and vCard, then CRM, printable campaigns, and card
                scanning — same account, same data model.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex min-h-11 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-ink transition hover:bg-white/90"
              >
                Open free workspace
              </Link>
            </LandingSplitSection>

            <div className="mt-16 grid items-center gap-10 border-t border-white/10 pt-16 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-bold sm:text-2xl">
                  Run the floor from your phone
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Multi-location owners get alerts, shortcuts, and module toggles without opening a
                  laptop between rushes.
                </p>
              </div>
              <LandingPhoneDashboard />
            </div>
          </div>
        </section>

        <LandingReferralBand />

        <section className="bg-paper py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="landing-final-cta rounded-[2rem] border border-line px-6 py-12 text-center shadow-[0_16px_48px_rgba(27,35,51,0.06)] sm:px-10 sm:py-14">
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Put your reputation desk on the counter this week
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">
                Claim your workspace, sync from Google, print QR art, and invite staff — reputation,
                menu, and contact card included on day one.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center rounded-2xl bg-ink px-8 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Create workspace
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

      <LandingFooter />
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

export type GuidePost = {
  slug: string;
  title: string;
  excerpt: string;
  readMinutes: number;
  category: 'Reviews' | 'Setup' | 'Growth';
  body: string[];
};

export const GUIDE_POSTS: GuidePost[] = [
  {
    slug: 'google-reviews-qr-setup',
    title: 'Set up your first review QR in under 5 minutes',
    excerpt:
      'Import from Google Business, print a counter QR, and start routing happy guests to leave public reviews.',
    readMinutes: 4,
    category: 'Setup',
    body: [
      'Create your QuickReview account and add a location — import from Google Business Profile when you can so your name, address, and review link stay accurate.',
      'Open QuickReview in the dashboard and turn on the guest review page. Pick a short public name guests will recognize on their phone.',
      'Download or print your QR from the QR Codes section. Place it at checkout, on tables, or on a small standee where customers naturally pause.',
      'When someone scans, they rate you with stars first. Four and five stars can open Google with an AI-drafted review they can edit; lower ratings stay private so you can fix issues before they hit your public profile.',
    ],
  },
  {
    slug: 'why-private-feedback-before-google',
    title: 'Why route low ratings to private feedback first',
    excerpt:
      'A one-tap star screen protects your reputation while still giving unhappy guests a voice.',
    readMinutes: 3,
    category: 'Reviews',
    body: [
      'Public Google reviews are permanent and visible to everyone searching for your shop. A single bad day at the counter should not define your average forever.',
      'QuickReview asks for stars on a branded page you control. Guests who tap one to three stars see a simple private form instead of being pushed straight to Google.',
      'You get the message in your dashboard so you can call back, offer a fix, or learn about a recurring issue. Guests who were heard are far less likely to vent publicly later.',
      'Guests who tap four or five stars still get a fast path to Google — often with an AI draft in their language so posting takes seconds, not minutes.',
    ],
  },
  {
    slug: 'menu-and-connect-same-qr',
    title: 'Menus and digital cards from the same QR',
    excerpt:
      'One code on the counter can open reviews, your mobile menu, or a tap-to-save contact card.',
    readMinutes: 5,
    category: 'Setup',
    body: [
      'Foot traffic businesses juggle paper menus, business cards, and review stickers. QuickReview keeps guest-facing products under one login and one QR family.',
      'Turn on Quick Commerce when you want a browsable menu or catalogue from the same location. Guests see prices and photos without installing an app.',
      'QuickConnect adds a digital card with phone, role, and links — useful for owners and front-desk staff who still hand out paper cards.',
      'You choose which products are live per location. Start with reviews only, then enable menu or connect when you are ready — no need to reprint a completely new system.',
    ],
  },
  {
    slug: 'crm-follow-ups-after-visit',
    title: 'Simple CRM follow-ups after a great visit',
    excerpt:
      'Log the customer, set a reminder, and close the loop after quotations or repeat visits.',
    readMinutes: 4,
    category: 'Growth',
    body: [
      'A good Google review is only one touchpoint. Many local shops lose repeat business because nobody wrote down who to call next week.',
      'QuickCRM lives inside the same workspace. Add a customer from your phone after a sale, attach a note, and schedule a follow-up for quotations or service reminders.',
      'You do not need a heavy sales pipeline — a short list of who to call today is enough for most counters and salons.',
      'Pair follow-ups with your review QR: happy guests leave stars publicly, and you keep the relationship private in CRM for the next visit.',
    ],
  },
];

export function getGuideBySlug(slug: string): GuidePost | undefined {
  return GUIDE_POSTS.find((post) => post.slug === slug);
}

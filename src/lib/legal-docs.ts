export type LegalDocId = 'terms' | 'privacy' | 'cancellation';

export const LEGAL_CONTACT_EMAIL = 'intelligicssolutions@gmail.com';

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDoc = {
  id: LegalDocId;
  path: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const sharedContact = `For questions about these policies, email ${LEGAL_CONTACT_EMAIL}.`;

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: 'terms',
    path: '/terms',
    title: 'Terms & Conditions',
    updated: '18 October 2026',
    intro:
      'These Terms & Conditions ("Terms") govern your access to and use of the QuickReview platform and related services ("Services"). QuickReview is owned and operated by Intelligic Solutions ("we", "us", "our"). By creating an account or using the Services, you agree to these Terms.',
    sections: [
      {
        heading: '1. Eligibility',
        paragraphs: [
          'You must be at least 18 years old and able to enter a binding contract. You represent that the business information you provide is accurate and that you are authorised to act on behalf of that business.',
        ],
      },
      {
        heading: '2. Accounts & security',
        paragraphs: [
          'You are responsible for keeping your login credentials confidential and for all activity under your account. Notify us promptly at intelligicssolutions@gmail.com if you suspect unauthorised access.',
        ],
      },
      {
        heading: '3. Subscriptions & payments',
        paragraphs: [
          'Paid plans are billed as shown at checkout (including applicable taxes). Access to paid features continues for the subscription period you purchase. Pricing and plan features may change; we will apply changes to new purchases or renewals after reasonable notice where required.',
          'Payments may be processed through third-party providers (for example Razorpay). Their terms may also apply to your transaction.',
        ],
      },
      {
        heading: '4. Acceptable use',
        paragraphs: [
          'You agree not to misuse the Services: no unlawful content, spam, harassment, infringement of others\' rights, attempts to bypass security, or interference with the platform. You are responsible for content you publish through QuickReview (menus, cards, review flows, CRM data) and for complying with applicable laws, including consumer and data-protection rules.',
        ],
      },
      {
        heading: '5. Third-party services',
        paragraphs: [
          'QuickReview may integrate with third-party services (for example Google, payment gateways). We do not control those services and are not liable for their availability or policies. Your use of third-party services is subject to their terms.',
        ],
      },
      {
        heading: '6. Intellectual property',
        paragraphs: [
          'We retain ownership of the QuickReview software, branding, and documentation. You retain ownership of your business content. You grant us a limited licence to host, display, and process your content solely to provide the Services.',
        ],
      },
      {
        heading: '7. Disclaimers & limitation of liability',
        paragraphs: [
          'The Services are provided "as is" to the extent permitted by law. We do not guarantee uninterrupted or error-free operation. To the maximum extent permitted by law, Intelligic Solutions is not liable for indirect, incidental, or consequential damages, or for loss of profits, data, or goodwill arising from your use of the Services.',
        ],
      },
      {
        heading: '8. Termination',
        paragraphs: [
          'You may stop using the Services at any time. We may suspend or terminate access if you breach these Terms or if required for security or legal reasons. Provisions that by nature should survive (including liability limits and governing law) survive termination.',
        ],
      },
      {
        heading: '9. Governing law',
        paragraphs: [
          'These Terms are governed by the laws of India. Courts at Bengaluru, Karnataka shall have exclusive jurisdiction, subject to applicable consumer protection laws.',
        ],
      },
      {
        heading: '10. Changes',
        paragraphs: [
          'We may update these Terms from time to time. The "Last updated" date at the top will change when we do. Continued use after changes constitutes acceptance of the updated Terms.',
          sharedContact,
        ],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    path: '/privacy-policy',
    title: 'Privacy Policy',
    updated: '18 October 2026',
    intro:
      'This Privacy Policy explains how Intelligic Solutions ("we", "us"), as the owner of QuickReview, collects, uses, and protects information when you use the QuickReview website and applications ("Services").',
    sections: [
      {
        heading: '1. Information we collect',
        paragraphs: [
          'Account data: name, email, password (stored in hashed form), and business or location details you provide.',
          'Usage data: logs, device/browser type, IP address, and actions within the app (for security, support, and product improvement).',
          'Customer & operational data you enter: CRM records, menu items, digital card content, review-related settings, and similar business data you choose to store in QuickReview.',
          'Payment data: billing amounts and transaction references. Card and UPI details are handled by our payment partners; we do not store full card numbers.',
        ],
      },
      {
        heading: '2. How we use information',
        paragraphs: [
          'To provide and improve the Services, authenticate users, process subscriptions, send service-related emails (such as verification and receipts), prevent fraud and abuse, and comply with law.',
          'We do not sell your personal information.',
        ],
      },
      {
        heading: '3. Sharing',
        paragraphs: [
          'We share data with service providers who help us operate QuickReview (hosting, email, analytics, payments) under confidentiality obligations. We may disclose information if required by law or to protect rights, safety, and security.',
          'Features you enable (for example public menus, connect pages, or review flows) may display information you configure to visitors you share links with.',
        ],
      },
      {
        heading: '4. Retention',
        paragraphs: [
          'We keep account and billing records as long as your account is active and as needed for legal, tax, and dispute purposes. You may request deletion of your account by contacting us; some data may be retained where required by law.',
        ],
      },
      {
        heading: '5. Security',
        paragraphs: [
          'We use reasonable technical and organisational measures to protect data. No method of transmission or storage is completely secure; use a strong password and keep it private.',
        ],
      },
      {
        heading: '6. Your choices',
        paragraphs: [
          'You can update much of your account information in the app. You may opt out of non-essential marketing emails if we send them. To access, correct, or delete personal data, contact intelligicssolutions@gmail.com.',
        ],
      },
      {
        heading: '7. Children',
        paragraphs: ['The Services are intended for businesses and are not directed at children under 18.'],
      },
      {
        heading: '8. Changes',
        paragraphs: [
          'We may update this Privacy Policy. The "Last updated" date will reflect changes. Material changes may be communicated via email or in-app notice where appropriate.',
          sharedContact,
        ],
      },
    ],
  },
  cancellation: {
    id: 'cancellation',
    path: '/cancellation-policy',
    title: 'Cancellation & Refund Policy',
    updated: '18 October 2026',
    intro:
      'This policy describes how subscriptions for QuickReview (operated by Intelligic Solutions) can be cancelled and when refunds apply.',
    sections: [
      {
        heading: '1. Cancelling a subscription',
        paragraphs: [
          'You may cancel a paid subscription by emailing intelligicssolutions@gmail.com from the email address on your QuickReview account. Include your business or location name and the product or plan you wish to cancel.',
          'Cancellation stops future renewals. Access to paid features typically continues until the end of the current billing period already paid for, unless a refund is issued under section 2 below.',
        ],
      },
      {
        heading: '2. Refunds',
        paragraphs: [
          'If you cancel within 3 (three) days of your initial purchase or renewal charge for a given plan, you may request a full refund of that charge.',
          'Refund requests must be sent to intelligicssolutions@gmail.com within those 3 days. Refunds are not available after 3 days from the charge date, except where required by applicable law.',
          'Approved refunds are processed to the original payment method within a reasonable period (typically 5–10 business days, depending on your bank or payment provider).',
        ],
      },
      {
        heading: '3. Trials & promotional offers',
        paragraphs: [
          'Free trials or promotional pricing are subject to the terms shown at signup. Cancelling before a paid charge avoids billing; once a paid charge occurs, the 3-day refund window in section 2 applies.',
        ],
      },
      {
        heading: '4. Contact',
        paragraphs: [
          'Intelligic Solutions — QuickReview',
          `Email: ${LEGAL_CONTACT_EMAIL}`,
          sharedContact,
        ],
      },
    ],
  },
};

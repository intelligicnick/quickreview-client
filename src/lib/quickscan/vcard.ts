import type { QuickScanContact } from './types';

export function vcardFilename(contact: QuickScanContact): string {
  const base = (contact.fullName || contact.company || 'contact')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'contact'}.vcf`;
}

export function buildQuickScanVcard(contact: QuickScanContact): string {
  const fn = contact.fullName?.trim() || 'Contact';
  const last = contact.lastName?.trim() || '';
  const first = contact.firstName?.trim() || fn;
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVcard(last)};${escapeVcard(first)};${escapeVcard(contact.namePrefix ?? '')};${escapeVcard(contact.nameSuffix ?? '')};`,
    `FN:${escapeVcard(fn)}`,
  ];
  if (contact.company?.trim()) lines.push(`ORG:${escapeVcard(contact.company.trim())}`);
  if (contact.jobTitle?.trim()) lines.push(`TITLE:${escapeVcard(contact.jobTitle.trim())}`);
  if (contact.department?.trim()) lines.push(`ROLE:${escapeVcard(contact.department.trim())}`);

  for (const phone of contact.mobiles) {
    lines.push(`TEL;TYPE=CELL:${escapeVcard(phone)}`);
  }
  for (const phone of contact.workPhones) {
    lines.push(`TEL;TYPE=WORK:${escapeVcard(phone)}`);
  }
  for (const phone of contact.homePhones) {
    lines.push(`TEL;TYPE=HOME:${escapeVcard(phone)}`);
  }
  if (contact.fax?.trim()) lines.push(`TEL;TYPE=FAX:${escapeVcard(contact.fax.trim())}`);
  if (contact.whatsapp?.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE,WHATSAPP:${escapeVcard(contact.whatsapp.trim())}`);
  }

  for (const email of contact.emails) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVcard(email)}`);
  }
  for (const url of contact.websites) {
    lines.push(`URL:${escapeVcard(url)}`);
  }
  for (const url of contact.socialLinks) {
    lines.push(`URL:${escapeVcard(url)}`);
  }

  const adr = [
    '',
    '',
    contact.addressStreet ?? '',
    contact.addressLocality ?? '',
    contact.addressCity ?? '',
    contact.addressState ?? '',
    contact.addressPostal ?? '',
    contact.addressCountry ?? '',
  ];
  if (adr.slice(2).some((p) => p.trim())) {
    lines.push(`ADR;TYPE=WORK:${adr.map(escapeVcard).join(';')}`);
  } else if (contact.addressFull?.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVcard(contact.addressFull)};;;;`);
  }

  const noteParts: string[] = [];
  if (contact.services.length) noteParts.push(`Services: ${contact.services.join(', ')}`);
  if (contact.products.length) noteParts.push(`Products: ${contact.products.join(', ')}`);
  if (contact.notes?.trim()) noteParts.push(contact.notes.trim());
  if (noteParts.length) lines.push(`NOTE:${escapeVcard(noteParts.join(' | '))}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadQuickScanVcard(contact: QuickScanContact): void {
  const body = buildQuickScanVcard(contact);
  const blob = new Blob([body], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = vcardFilename(contact);
  anchor.click();
  URL.revokeObjectURL(url);
}

export function copyQuickScanSummary(contact: QuickScanContact): string {
  const rows: string[] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value?.trim()) rows.push(`${label}: ${value.trim()}`);
  };
  add('Name', contact.fullName);
  add('Company', contact.company);
  add('Title', contact.jobTitle);
  if (contact.mobiles.length) rows.push(`Mobile: ${contact.mobiles.join(', ')}`);
  if (contact.workPhones.length) rows.push(`Work: ${contact.workPhones.join(', ')}`);
  if (contact.emails.length) rows.push(`Email: ${contact.emails.join(', ')}`);
  add('Website', contact.websites[0]);
  add('Address', contact.addressFull);
  return rows.join('\n');
}

function escapeVcard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

function selfCheck(): void {
  const sample = buildQuickScanVcard({
    fullName: 'Rajesh Kumar',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    namePrefix: null,
    nameSuffix: null,
    company: 'Acme Pvt Ltd',
    jobTitle: 'Director',
    department: null,
    mobiles: ['+91 98765 43210'],
    workPhones: [],
    homePhones: [],
    fax: null,
    whatsapp: null,
    emails: ['rajesh@acme.co.in'],
    websites: ['https://acme.co.in'],
    addressStreet: '123 MG Road',
    addressLocality: null,
    addressCity: 'Bangalore',
    addressState: 'Karnataka',
    addressPostal: '560001',
    addressCountry: 'India',
    addressFull: '123 MG Road, Bangalore 560001',
    socialLinks: [],
    services: [],
    products: [],
    notes: null,
    rawOcrText: '',
    fieldConfidence: {},
  });
  if (!sample.includes('BEGIN:VCARD') || !sample.includes('END:VCARD')) {
    throw new Error('vcard self-check failed');
  }
}

selfCheck();

export type ScannedContactFields = {
  fullName: string | null;
  phones: string[];
  emails: string[];
  websites: string[];
  address: string | null;
  services: string[];
  products: string[];
  other: string | null;
};

export function buildScannedVcard(contact: ScannedContactFields, filename = 'contact.vcf') {
  const name = contact.fullName?.trim() || 'Contact';
  const noteParts: string[] = [];
  if (contact.services.length) noteParts.push(`Services: ${contact.services.join(', ')}`);
  if (contact.products.length) noteParts.push(`Products: ${contact.products.join(', ')}`);
  if (contact.other?.trim()) noteParts.push(contact.other.trim());
  const note = noteParts.join(' | ');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcard(name)}`,
    ...contact.phones.map((phone) => `TEL;TYPE=CELL:${escapeVcard(phone)}`),
    ...contact.emails.map((email) => `EMAIL:${escapeVcard(email)}`),
    ...contact.websites.map((url) => `URL:${escapeVcard(url)}`),
    contact.address ? `ADR;TYPE=WORK:;;${escapeVcard(contact.address)};;;;` : '',
    note ? `NOTE:${escapeVcard(note)}` : '',
    'END:VCARD',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeVcard(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, ' ');
}

export function joinContactList(values: string[]): string {
  return values.join(', ');
}

export function splitContactList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

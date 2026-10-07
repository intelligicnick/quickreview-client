import type { ScannedContactFields } from '../scanned-vcard';
import type { QuickScanContact } from './types';

/** Map rich local contact into existing API DTO shape (no schema change). */
export function quickScanToServerFields(contact: QuickScanContact): ScannedContactFields & {
  fullName: string | null;
} {
  const phones = [
    ...contact.mobiles,
    ...contact.workPhones,
    ...contact.homePhones,
    ...(contact.fax ? [contact.fax] : []),
    ...(contact.whatsapp ? [contact.whatsapp] : []),
  ];
  const otherParts: string[] = [];
  if (contact.company?.trim()) otherParts.push(contact.company.trim());
  if (contact.jobTitle?.trim()) otherParts.push(contact.jobTitle.trim());
  if (contact.department?.trim()) otherParts.push(contact.department.trim());
  if (contact.socialLinks.length) otherParts.push(`Social: ${contact.socialLinks.join(', ')}`);
  if (contact.notes?.trim()) otherParts.push(contact.notes.trim());

  return {
    fullName: contact.fullName,
    phones,
    emails: contact.emails,
    websites: [...contact.websites, ...contact.socialLinks],
    address: contact.addressFull,
    services: contact.services,
    products: contact.products,
    other: otherParts.length ? otherParts.join(' | ') : null,
  };
}

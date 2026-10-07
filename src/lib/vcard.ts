import type { ConnectCardProfile } from '../components/connect/ConnectCardShell';

export function downloadConnectVCard(profile: ConnectCardProfile, filename = 'contact.vcf') {
  const name = profile.displayName.trim() || 'Contact';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcard(name)}`,
    profile.phone ? `TEL;TYPE=CELL:${escapeVcard(profile.phone)}` : '',
    profile.email ? `EMAIL:${escapeVcard(profile.email)}` : '',
    profile.companyName ? `ORG:${escapeVcard(profile.companyName)}` : '',
    profile.designation ? `TITLE:${escapeVcard(profile.designation)}` : '',
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
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

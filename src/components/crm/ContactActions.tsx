import { MessageCircle, Phone } from 'lucide-react';
import { telHref, whatsAppHref } from '../../lib/crm/whatsapp';

type Props = {
  mobile: string;
  name?: string;
  whatsAppMessage?: string;
  onCall?: () => void;
  compact?: boolean;
};

export function ContactActions({ mobile, name, whatsAppMessage, onCall, compact }: Props) {
  const label = name ? `Contact ${name}` : 'Contact';
  const btn = compact
    ? 'inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-sm font-semibold text-ink'
    : 'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-semibold text-ink';

  return (
    <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label={label}>
      <a
        href={telHref(mobile)}
        className={`${btn} hover:bg-paper`}
        onClick={() => onCall?.()}
      >
        <Phone className="h-4 w-4 text-brand" />
        Call
      </a>
      <a
        href={whatsAppHref(mobile, whatsAppMessage)}
        target="_blank"
        rel="noreferrer"
        className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  );
}

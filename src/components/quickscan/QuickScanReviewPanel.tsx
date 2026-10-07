import {
  Copy,
  Download,
  RefreshCw,
  ScanLine,
} from 'lucide-react';
import type { FieldConfidence, QuickScanContact } from '../../lib/quickscan/types';
import { buildQuickScanVcard, copyQuickScanSummary, downloadQuickScanVcard } from '../../lib/quickscan/vcard';

type QuickScanReviewPanelProps = {
  contact: QuickScanContact;
  previewUrl: string | null;
  originalUrl: string | null;
  onChange: (next: QuickScanContact) => void;
  onReprocess: () => void;
  onScanAnother: () => void;
  onDownload?: () => void;
  extraActions?: React.ReactNode;
};

export function QuickScanReviewPanel({
  contact,
  previewUrl,
  originalUrl,
  onChange,
  onReprocess,
  onScanAnother,
  onDownload,
  extraActions,
}: QuickScanReviewPanelProps) {
  function patch(partial: Partial<QuickScanContact>) {
    onChange({ ...contact, ...partial });
  }

  async function copyDetails() {
    await navigator.clipboard.writeText(copyQuickScanSummary(contact));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Card preview</p>
        {previewUrl ? (
          <img src={previewUrl} alt="Processed card" className="w-full rounded-2xl border border-line object-contain" />
        ) : null}
        {originalUrl ? (
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-muted">Compare original photo</summary>
            <img src={originalUrl} alt="Original card" className="mt-2 w-full rounded-xl border border-line object-contain" />
          </details>
        ) : null}
        <details className="rounded-xl border border-line bg-paper p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Raw OCR text</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted">
            {contact.rawOcrText || 'No text detected'}
          </pre>
        </details>
        <details className="rounded-xl border border-line bg-paper p-3 text-sm">
          <summary className="cursor-pointer font-semibold">VCF preview</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted">
            {buildQuickScanVcard(contact)}
          </pre>
        </details>
      </div>

      <div className="space-y-5">
        <Section title="Personal details">
          <FieldInput label="Full name" confidence={contact.fieldConfidence.fullName} value={contact.fullName ?? ''} onChange={(v) => patch({ fullName: v || null })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput label="First name" value={contact.firstName ?? ''} onChange={(v) => patch({ firstName: v || null })} />
            <FieldInput label="Last name" value={contact.lastName ?? ''} onChange={(v) => patch({ lastName: v || null })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput label="Prefix" value={contact.namePrefix ?? ''} onChange={(v) => patch({ namePrefix: v || null })} />
            <FieldInput label="Suffix" value={contact.nameSuffix ?? ''} onChange={(v) => patch({ nameSuffix: v || null })} />
          </div>
        </Section>

        <Section title="Professional details">
          <FieldInput label="Company" confidence={contact.fieldConfidence.company} value={contact.company ?? ''} onChange={(v) => patch({ company: v || null })} />
          <FieldInput label="Job title" confidence={contact.fieldConfidence.jobTitle} value={contact.jobTitle ?? ''} onChange={(v) => patch({ jobTitle: v || null })} />
          <FieldInput label="Department" value={contact.department ?? ''} onChange={(v) => patch({ department: v || null })} />
        </Section>

        <Section title="Contact information">
          <ListInput label="Mobile numbers" confidence={contact.fieldConfidence.mobiles} values={contact.mobiles} onChange={(mobiles) => patch({ mobiles })} />
          <ListInput label="Work phones" values={contact.workPhones} onChange={(workPhones) => patch({ workPhones })} />
          <ListInput label="Home phones" values={contact.homePhones} onChange={(homePhones) => patch({ homePhones })} />
          <FieldInput label="Fax" value={contact.fax ?? ''} onChange={(v) => patch({ fax: v || null })} />
          <FieldInput label="WhatsApp (only if on card)" value={contact.whatsapp ?? ''} onChange={(v) => patch({ whatsapp: v || null })} />
          <ListInput label="Email addresses" confidence={contact.fieldConfidence.emails} values={contact.emails} onChange={(emails) => patch({ emails })} />
          <ListInput label="Websites" values={contact.websites} onChange={(websites) => patch({ websites })} />
        </Section>

        <Section title="Address">
          <FieldInput label="Full address" confidence={contact.fieldConfidence.addressFull} value={contact.addressFull ?? ''} onChange={(v) => patch({ addressFull: v || null })} />
          <FieldInput label="Street" value={contact.addressStreet ?? ''} onChange={(v) => patch({ addressStreet: v || null })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput label="City" value={contact.addressCity ?? ''} onChange={(v) => patch({ addressCity: v || null })} />
            <FieldInput label="State" value={contact.addressState ?? ''} onChange={(v) => patch({ addressState: v || null })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput label="Postal code" value={contact.addressPostal ?? ''} onChange={(v) => patch({ addressPostal: v || null })} />
            <FieldInput label="Country" value={contact.addressCountry ?? ''} onChange={(v) => patch({ addressCountry: v || null })} />
          </div>
        </Section>

        <Section title="Additional information">
          <ListInput label="Social links" values={contact.socialLinks} onChange={(socialLinks) => patch({ socialLinks })} />
          <ListInput label="Services" values={contact.services} onChange={(services) => patch({ services })} />
          <ListInput label="Products" values={contact.products} onChange={(products) => patch({ products })} />
          <FieldInput label="Notes / other text" multiline value={contact.notes ?? ''} onChange={(v) => patch({ notes: v || null })} />
        </Section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyDetails()}
            className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold"
          >
            <Copy className="h-4 w-4" />
            Copy details
          </button>
          <button
            type="button"
            onClick={() => {
              downloadQuickScanVcard(contact);
              onDownload?.();
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Download VCF
          </button>
          <button
            type="button"
            onClick={onReprocess}
            className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Reprocess image
          </button>
          <button
            type="button"
            onClick={onScanAnother}
            className="inline-flex items-center gap-1 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-sm font-semibold text-brand"
          >
            <ScanLine className="h-4 w-4" />
            Scan another
          </button>
          {extraActions}
        </div>
        <p className="text-xs text-muted">
          Fields marked “check” had lower OCR confidence — please verify before saving or downloading.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function ConfidenceBadge({ level }: { level?: FieldConfidence }) {
  if (!level || level === 'high') return null;
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        level === 'low' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
      }`}
    >
      check
    </span>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  multiline,
  confidence,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  confidence?: FieldConfidence;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">
        {label}
        <ConfidenceBadge level={confidence} />
      </span>
      {multiline ? (
        <textarea
          className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function ListInput({
  label,
  values,
  onChange,
  confidence,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  confidence?: FieldConfidence;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">
        {label}
        <ConfidenceBadge level={confidence} />
      </span>
      <textarea
        className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
        rows={2}
        value={values.join('\n')}
        onChange={(e) =>
          onChange(
            e.target.value
              .split('\n')
              .map((v) => v.trim())
              .filter(Boolean),
          )
        }
        placeholder="One per line"
      />
    </label>
  );
}

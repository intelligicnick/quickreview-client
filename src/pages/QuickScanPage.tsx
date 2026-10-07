import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import {
  Contact,
  Download,
  Eye,
  History,
  ImagePlus,
  Loader2,
  Pencil,
  ScanLine,
  Trash2,
  X,
} from 'lucide-react';
import { CardCameraCapture } from '../components/CardCameraCapture';
import { CardImageEditor } from '../components/quickscan/CardImageEditor';
import { QuickScanReviewPanel } from '../components/quickscan/QuickScanReviewPanel';
import { api, apiForm, ApiError } from '../lib/api';
import { buildScannedVcard, joinContactList, splitContactList, type ScannedContactFields } from '../lib/scanned-vcard';
import {
  clearScanHistory,
  deleteScanHistory,
  listScanHistory,
  saveScanHistory,
} from '../lib/quickscan/history';
import { ocrConfidenceBand, recognizeMultipleBlobs } from '../lib/quickscan/ocr';
import { mergeQuickScanContacts, parseToQuickScanContact } from '../lib/quickscan/parse-card-text';
import { quickScanToServerFields } from '../lib/quickscan/server-map';
import { emptyQuickScanContact, type QuickScanContact, type QuickScanHistoryRow } from '../lib/quickscan/types';
import { downloadQuickScanVcard } from '../lib/quickscan/vcard';
import { useLocationContext } from '../lib/location-context';

type CaptureMode = 'front' | 'back' | 'both';
type FlowStep = 'home' | 'capture' | 'edit' | 'processing' | 'review';

type ContactRow = ScannedContactFields & { id: string; createdAt: string };
type Hub = { scanUnlocked: boolean; contacts: ContactRow[] };

type ProcessedSide = { blob: Blob; previewUrl: string; originalUrl: string };

const MODE_OPTIONS: { id: CaptureMode; label: string; hint: string }[] = [
  { id: 'front', label: 'Front only', hint: 'Scan the front of the visiting card' },
  { id: 'back', label: 'Back only', hint: 'Scan the back for extra numbers or address' },
  { id: 'both', label: 'Front & back', hint: 'Merge details from both sides into one contact' },
];

export function QuickScanPage() {
  const { selected } = useLocationContext();
  const [hub, setHub] = useState<Hub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('home');
  const [mode, setMode] = useState<CaptureMode>('front');
  const [captureSide, setCaptureSide] = useState<'front' | 'back'>('front');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [processedSides, setProcessedSides] = useState<ProcessedSide[]>([]);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [contact, setContact] = useState<QuickScanContact | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [saveToCloud, setSaveToCloud] = useState(false);
  const [savingCloud, setSavingCloud] = useState(false);
  const [history, setHistory] = useState<QuickScanHistoryRow[]>([]);
  const [sheetContact, setSheetContact] = useState<ContactRow | null>(null);

  useEffect(() => {
    void listScanHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (!selected) {
      setHub(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<Hub>(`/api/locations/${selected.id}/quickscan`);
        if (!cancelled) {
          setHub({ ...data, contacts: data.contacts.map((c) => normalizeRow(c as ContactRow)) });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load saved contacts');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  function resetScanSession() {
    setFlowStep('home');
    setPendingFile(null);
    setProcessedSides([]);
    setContact(null);
    setPreviewUrl(null);
    setOriginalUrl(null);
    setOcrProgress(0);
    setOcrStatus('');
    setSaveToCloud(false);
    setCaptureSide('front');
  }

  function startScan() {
    setError(null);
    setMode('front');
    setCaptureSide('front');
    setProcessedSides([]);
    setFlowStep('capture');
  }

  function onRawCapture(file: File) {
    setPendingFile(file);
    setFlowStep('edit');
  }

  function onImageProcessed(blob: Blob, preview: string, original: string) {
    const nextSide: ProcessedSide = { blob, previewUrl: preview, originalUrl: original };
    const nextSides = [...processedSides, nextSide];
    setProcessedSides(nextSides);
    setPendingFile(null);
    if (mode === 'both' && nextSides.length < 2) {
      setCaptureSide('back');
      setFlowStep('capture');
      return;
    }
    void runLocalOcr(nextSides);
  }

  async function runLocalOcr(sides: ProcessedSide[]) {
    setFlowStep('processing');
    setOcrProgress(0);
    setOcrStatus('Loading OCR engine (first scan may download language data)…');
    try {
      const result = await recognizeMultipleBlobs(
        sides.map((s) => s.blob),
        (p) => {
          setOcrProgress(Math.round(p.progress * 100));
          setOcrStatus(p.status);
        },
      );
      if (!result.text.trim()) {
        throw new Error('No text found — try a clearer photo, crop tighter, or enter details manually.');
      }
      const band = ocrConfidenceBand(result.meanConfidence);
      let parsed = parseToQuickScanContact(result.text, band);
      if (sides.length === 2) {
        const half = result.text.split('\n\n---\n\n');
        if (half.length >= 2) {
          const a = parseToQuickScanContact(half[0] ?? '', band);
          const b = parseToQuickScanContact(half[1] ?? '', band);
          parsed = mergeQuickScanContacts(a, b);
          parsed.rawOcrText = result.text;
        }
      }
      setContact(parsed);
      setPreviewUrl(sides[sides.length - 1]?.previewUrl ?? null);
      setOriginalUrl(sides[0]?.originalUrl ?? null);
      setFlowStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed');
      setContact({ ...emptyQuickScanContact(), rawOcrText: '' });
      setFlowStep('review');
    }
  }

  async function persistHistory(next: QuickScanContact) {
    try {
      const row = await saveScanHistory(next);
      setHistory((prev) => [row, ...prev.filter((r) => r.id !== row.id)]);
    } catch {
      /* optional */
    }
  }

  async function saveContactToCloud(next: QuickScanContact) {
    if (!selected || !hub?.scanUnlocked) return;
    setSavingCloud(true);
    setError(null);
    try {
      const fields = quickScanToServerFields(next);
      const form = new FormData();
      form.set('mode', processedSides.length > 1 ? 'both' : 'front');
      if (processedSides[0]?.blob) {
        form.append('front', new File([processedSides[0].blob], 'front.png', { type: 'image/png' }));
      }
      if (processedSides[1]?.blob) {
        form.append('back', new File([processedSides[1].blob], 'back.png', { type: 'image/png' }));
      }
      const created = await apiForm<{ contact: ContactRow }>(
        `/api/locations/${selected.id}/quickscan/scan`,
        form,
      );
      await api(`/api/locations/${selected.id}/quickscan/contacts/${created.contact.id}`, {
        method: 'PATCH',
        body: {
          fullName: fields.fullName ?? '',
          phones: fields.phones,
          emails: fields.emails,
          websites: fields.websites,
          address: fields.address ?? '',
          services: fields.services,
          products: fields.products,
          other: fields.other ?? '',
        },
      });
      const data = await api<Hub>(`/api/locations/${selected.id}/quickscan`);
      setHub({ ...data, contacts: data.contacts.map((c) => normalizeRow(c as ContactRow)) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save to location');
    } finally {
      setSavingCloud(false);
    }
  }

  const unlocked = hub?.scanUnlocked ?? false;

  if (flowStep === 'review' && contact) {
    return (
      <div>
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold tracking-tight">Review contact</h1>
          <p className="mt-1 text-sm text-muted">
            OCR runs on your device. Nothing is sent online unless you choose to save to this location.
          </p>
        </div>
        {error ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <QuickScanReviewPanel
          contact={contact}
          previewUrl={previewUrl}
          originalUrl={originalUrl}
          onChange={setContact}
          onReprocess={() => {
            if (processedSides.length) void runLocalOcr(processedSides);
          }}
          onScanAnother={resetScanSession}
          onDownload={() => void persistHistory(contact)}
          extraActions={
            selected && unlocked ? (
              <label className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveToCloud}
                  onChange={(e) => setSaveToCloud(e.target.checked)}
                />
                Save to {selected.name} (uploads images to your account)
              </label>
            ) : null
          }
        />
        {selected && unlocked && saveToCloud ? (
          <button
            type="button"
            disabled={savingCloud}
            onClick={() => void saveContactToCloud(contact)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingCloud ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save to location
          </button>
        ) : null}
      </div>
    );
  }

  if (flowStep === 'processing') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <p className="mt-4 text-sm font-semibold">{ocrStatus || 'Processing…'}</p>
        <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-paper">
          <div className="h-full bg-brand transition-all" style={{ width: `${ocrProgress}%` }} />
        </div>
        <p className="mt-2 max-w-sm text-xs text-muted">
          Tesseract downloads language data once (~15–30 MB). Works offline afterward in supported browsers.
        </p>
      </div>
    );
  }

  if (flowStep === 'edit' && pendingFile) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Prepare image</h1>
        <CardImageEditor
          file={pendingFile}
          label={captureSide === 'front' ? 'Front of card' : 'Back of card'}
          onCancel={() => setFlowStep('capture')}
          onConfirm={onImageProcessed}
        />
      </div>
    );
  }

  if (flowStep === 'capture') {
    return (
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Scan visiting card</h1>
            <p className="mt-1 text-sm text-muted">Camera or upload — JPG, PNG, WebP supported.</p>
          </div>
          <button type="button" onClick={resetScanSession} className="rounded-lg p-2 text-muted hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MODE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setCaptureSide(item.id === 'back' ? 'back' : 'front');
                setProcessedSides([]);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                mode === item.id ? 'border-brand bg-brand/5 text-brand' : 'border-line'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <CardCameraCapture
          active
          sideLabel={
            mode === 'both' && processedSides.length > 0
              ? 'Capture the back of the card'
              : 'Align the card in the frame'
          }
          onCapture={onRawCapture}
          onError={setError}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">QuickScan</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Scan or upload a visiting card, review extracted details, and download a vCard — processed locally in
            your browser with free OCR. No API keys required.
          </p>
        </div>
        <button
          type="button"
          onClick={startScan}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ScanLine className="h-4 w-4" />
          Scan visiting card
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={startScan}
          className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left"
        >
          <ScanLine className="h-8 w-8 text-brand" />
          <div>
            <p className="font-semibold">Use camera</p>
            <p className="text-sm text-muted">Rear camera on mobile, webcam on desktop</p>
          </div>
        </button>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <ImagePlus className="h-8 w-8 text-brand" />
          <div>
            <p className="font-semibold">Upload image</p>
            <p className="text-sm text-muted">JPG, PNG or WebP from gallery</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setError(null);
                setFlowStep('edit');
                setPendingFile(file);
              }
            }}
          />
        </label>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <HistorySection
        history={history}
        onOpen={(row) => {
          setContact(row.contact);
          setFlowStep('review');
        }}
        onDelete={(id) => void deleteScanHistory(id).then(() => listScanHistory().then(setHistory))}
        onClear={() => void clearScanHistory().then(() => setHistory([]))}
      />

      {!selected ? <p className="mt-6 text-sm text-muted">Select a location to sync contacts to the cloud.</p> : null}

      {selected && hub && !unlocked ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-6">
          <p className="font-semibold">Cloud backup is locked</p>
          <p className="mt-1 text-sm text-muted">
            Scanning and VCF download work without a plan. Activate QuickScan to save contacts to this location.
          </p>
          <Link to="/app/subscription" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            View plans
          </Link>
        </div>
      ) : null}

      {selected && hub && unlocked ? (
        <CloudContactsSection
          contacts={hub.contacts}
          onView={setSheetContact}
          onDelete={(id) => void removeCloudContact(selected.id, id, setHub, sheetContact, setSheetContact)}
          onDownloadVcf={(c) => buildScannedVcard(c, vcardName(c))}
        />
      ) : null}

      {sheetContact ? (
        <CloudContactSheet contact={sheetContact} onClose={() => setSheetContact(null)} locationId={selected!.id} setHub={setHub} />
      ) : null}
    </div>
  );
}

function normalizeRow(row: ContactRow): ContactRow {
  return {
    ...row,
    phones: row.phones ?? [],
    emails: row.emails ?? [],
    websites: row.websites ?? [],
    services: row.services ?? [],
    products: row.products ?? [],
    other: row.other ?? null,
  };
}

function vcardName(contact: ContactRow): string {
  const base = (contact.fullName || 'contact').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base || 'contact'}.vcf`;
}

async function removeCloudContact(
  locationId: string,
  contactId: string,
  setHub: React.Dispatch<React.SetStateAction<Hub | null>>,
  sheet: ContactRow | null,
  setSheet: (c: ContactRow | null) => void,
) {
  await api(`/api/locations/${locationId}/quickscan/contacts/${contactId}`, { method: 'DELETE' });
  setHub((prev) => (prev ? { ...prev, contacts: prev.contacts.filter((r) => r.id !== contactId) } : prev));
  if (sheet?.id === contactId) setSheet(null);
}

function HistorySection({
  history,
  onOpen,
  onDelete,
  onClear,
}: {
  history: QuickScanHistoryRow[];
  onOpen: (row: QuickScanHistoryRow) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (!history.length) return null;
  return (
    <section className="mt-8">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <History className="h-4 w-4" />
        Local scan history ({history.length})
      </p>
      <p className="mt-1 text-xs text-muted">Stored on this device only — contact fields, not card photos.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {history.slice(0, 8).map((row) => (
          <li key={row.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-3 text-sm">
            <button type="button" className="text-left font-semibold" onClick={() => onOpen(row)}>
              {row.contact.fullName ?? row.contact.company ?? 'Unnamed'}
              <span className="block text-xs font-normal text-muted">
                {new Date(row.scannedAt).toLocaleString()}
              </span>
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg border border-line p-2"
                aria-label="Download VCF"
                onClick={() => downloadQuickScanVcard(row.contact)}
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-line p-2 text-red-700"
                aria-label="Delete"
                onClick={() => onDelete(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClear} className="mt-2 text-xs font-semibold text-red-700">
        Clear all local history
      </button>
    </section>
  );
}

function CloudContactsSection({
  contacts,
  onView,
  onDelete,
  onDownloadVcf,
}: {
  contacts: ContactRow[];
  onView: (c: ContactRow) => void;
  onDelete: (id: string) => void;
  onDownloadVcf: (c: ContactRow) => void;
}) {
  return (
    <section className="mt-8">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Contact className="h-4 w-4" />
        Saved to location ({contacts.length})
      </p>
      {contacts.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No cloud contacts yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <li key={contact.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="font-semibold">{contact.fullName ?? 'Unnamed'}</p>
              {contact.phones[0] ? <p className="text-sm">{contact.phones[0]}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onView(contact)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">
                  <Eye className="inline h-3.5 w-3.5" /> View
                </button>
                <button type="button" onClick={() => onDownloadVcf(contact)} className="rounded-lg border border-brand/30 px-3 py-1.5 text-xs font-semibold text-brand">
                  VCF
                </button>
                <button type="button" onClick={() => onDelete(contact.id)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-red-700">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CloudContactSheet({
  contact,
  onClose,
  locationId,
  setHub,
}: {
  contact: ContactRow;
  onClose: () => void;
  locationId: string;
  setHub: Dispatch<SetStateAction<Hub | null>>;
}) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(contact);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const result = await api<{ contact: ContactRow }>(
        `/api/locations/${locationId}/quickscan/contacts/${contact.id}`,
        {
          method: 'PATCH',
          body: {
            fullName: draft.fullName ?? '',
            phones: draft.phones,
            emails: draft.emails,
            websites: draft.websites,
            address: draft.address ?? '',
            services: draft.services,
            products: draft.products,
            other: draft.other ?? '',
          },
        },
      );
      setHub((prev) =>
        prev ? { ...prev, contacts: prev.contacts.map((r) => (r.id === result.contact.id ? result.contact : r)) } : prev,
      );
      setEdit(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold">{edit ? 'Edit' : 'Contact'}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {edit ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <EditInput label="Name" value={draft.fullName ?? ''} onChange={(v) => setDraft({ ...draft, fullName: v })} />
            <EditInput label="Phones" value={joinContactList(draft.phones)} onChange={(v) => setDraft({ ...draft, phones: splitContactList(v) })} />
            <EditInput label="Emails" value={joinContactList(draft.emails)} onChange={(v) => setDraft({ ...draft, emails: splitContactList(v) })} />
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white">
              Save
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            <p>{contact.fullName}</p>
            <p className="text-muted">{joinContactList(contact.phones)}</p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEdit(true)} className="flex-1 rounded-xl border border-line py-2 text-sm font-semibold">
                <Pencil className="inline h-4 w-4" /> Edit
              </button>
              <button type="button" onClick={() => buildScannedVcard(contact, vcardName(contact))} className="flex-1 rounded-xl bg-brand py-2 text-sm font-semibold text-white">
                Download VCF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

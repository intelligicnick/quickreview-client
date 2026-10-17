import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LinkSuccess, type LinkSuccessSummary } from '../../components/counter-sale/LinkSuccess';
import { deriveStepStates, ProgressSteps } from '../../components/counter-sale/ProgressSteps';
import { SelectableCard } from '../../components/counter-sale/SelectableCard';
import { StepCard } from '../../components/counter-sale/StepCard';
import { StickyActionBar } from '../../components/counter-sale/StickyActionBar';
import { StandeeQrScanner } from '../../components/counter-sale/StandeeQrScanner';
import { IconCheck, IconSearch } from '../../components/counter-sale/icons';
import {
  counterSaleApi,
  CounterSaleApiError,
  getCounterSaleToken,
  setCounterSaleToken,
  takeCounterSaleTokenFromHash,
} from '../../lib/counter-sale-api';

type PlaceRow = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
};

type QrLookupStatus = 'ready' | 'assigned' | 'not_found' | 'not_printed';

type QrLookupState = 'idle' | 'checking' | QrLookupStatus | 'error';

function parseQrInput(raw: string): string {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/\/q\/([A-Za-z0-9]+)/i)?.[1];
  return (fromUrl ?? trimmed).toUpperCase();
}

function normalizeStandeeCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
}

function playScanSound(kind: 'success' | 'error') {
  try {
    const ctx = new AudioContext();
    const tones =
      kind === 'success'
        ? [{ f: 880, t: 0 }, { f: 1175, t: 0.12 }]
        : [{ f: 220, t: 0 }, { f: 180, t: 0.1 }];
    for (const { f, t } of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    }
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    /* silent fallback */
  }
}

function resolveAgentSessionToken(): string | null {
  const fromHash = takeCounterSaleTokenFromHash();
  if (fromHash) {
    setCounterSaleToken(fromHash);
    return fromHash;
  }
  return getCounterSaleToken();
}

function nextActionHint(qrDone: boolean, placeDone: boolean): string {
  if (!qrDone) return 'Scan or enter the standee code';
  if (!placeDone) return 'Pick the Google Business profile';
  return 'Tap Link & activate';
}

const SERVICES = [
  { key: 'review' as const, title: 'QuickReview', subtitle: 'Google review after scan' },
  { key: 'menu' as const, title: 'QuickCommerce', subtitle: 'Ordering & catalogue' },
] as const;

export function CounterSaleLinkPage() {
  const [token] = useState(() => resolveAgentSessionToken());
  const lookupBusy = useRef(false);
  const [scannerEpoch, setScannerEpoch] = useState(0);

  const [qrCode, setQrCode] = useState('');
  const [qrLookup, setQrLookup] = useState<QrLookupState>('idle');
  const [qrScanHint, setQrScanHint] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceRow[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceRow | null>(null);
  const [service, setService] = useState<'review' | 'menu'>('review');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successSummary, setSuccessSummary] = useState<LinkSuccessSummary | null>(null);

  const qrDone = qrLookup === 'ready';
  const placeDone = Boolean(selectedPlace);
  const serviceSelected = Boolean(service);
  const serviceStepDone = qrDone && placeDone;
  const doneCount = (qrDone ? 1 : 0) + (placeDone ? 1 : 0) + (serviceSelected ? 1 : 0);
  const canLink = qrDone && placeDone && serviceSelected && !busy;

  const progressStates = deriveStepStates(qrDone, placeDone, serviceStepDone);
  const progressHint = useMemo(
    () => `${doneCount} of 3 done · ${nextActionHint(qrDone, placeDone)}`,
    [doneCount, qrDone, placeDone],
  );

  useEffect(() => {
    if (qrCode.length !== 8) {
      setQrLookup('idle');
      return;
    }
    let cancelled = false;
    setQrLookup('checking');
    void (async () => {
      try {
        const result = await counterSaleApi<{ code: string; status: QrLookupStatus }>(
          `/api/counter-sale/qr-codes/lookup?code=${encodeURIComponent(qrCode)}`,
        );
        if (cancelled) return;
        setQrCode(result.code);
        setQrLookup(result.status);
      } catch {
        if (!cancelled) setQrLookup('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrCode]);

  const handleScannedRaw = useCallback(
    async (raw: string) => {
      const code = parseQrInput(raw);
      if (!code || lookupBusy.current) return;
      lookupBusy.current = true;
      try {
        const result = await counterSaleApi<{ code: string; status: QrLookupStatus }>(
          `/api/counter-sale/qr-codes/lookup?code=${encodeURIComponent(code)}`,
        );
        if (result.status === 'ready') {
          setQrCode(result.code);
          setQrLookup('ready');
          setQrScanHint(null);
          setScanError(null);
          playScanSound('success');
          setScannerEpoch((e) => e + 1);
          return;
        }
        if (result.status === 'assigned') {
          setQrScanHint('Already assigned — scan a different QR');
          setQrLookup('assigned');
          playScanSound('error');
          return;
        }
        if (result.status === 'not_printed') {
          setQrScanHint('This code is not a printed standee — scan a different QR');
          setQrLookup('not_printed');
          playScanSound('error');
          return;
        }
        setQrScanHint('QR code not found — scan a different QR');
        setQrLookup('not_found');
        playScanSound('error');
      } catch {
        setQrScanHint('Could not verify QR — try again or enter the code manually');
        setQrLookup('error');
        playScanSound('error');
      } finally {
        lookupBusy.current = false;
      }
    },
    [],
  );

  if (!token) {
    return <Navigate to="/counter-sale/login" replace />;
  }

  function resetFlow() {
    setScannerEpoch((e) => e + 1);
    setQrCode('');
    setQrLookup('idle');
    setQrScanHint(null);
    setScanError(null);
    setPlaceSearch('');
    setPlaceResults([]);
    setSelectedPlace(null);
    setService('review');
    setError(null);
    setSuccessSummary(null);
  }

  async function searchPlaces(event: FormEvent) {
    event.preventDefault();
    const q = placeSearch.trim();
    if (q.length < 3) {
      setError('Type at least 3 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rows = await counterSaleApi<PlaceRow[]>(
        `/api/counter-sale/places/search?q=${encodeURIComponent(q)}`,
      );
      setPlaceResults(rows);
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Search failed');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!selectedPlace || !qrDone) return;
    setBusy(true);
    setError(null);
    try {
      await counterSaleApi<{
        targetUrl: string | null;
        location: { googleReviewUrl: string | null; name: string };
      }>('/api/counter-sale/provisions', {
        method: 'POST',
        body: {
          qrCode: qrCode.trim(),
          placeId: selectedPlace.placeId,
          service,
        },
      });
      setSuccessSummary({
        qrCode,
        businessName: selectedPlace.name,
        service,
      });
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Could not link');
    } finally {
      setBusy(false);
    }
  }

  function qrHelperText(): ReactNode {
    if (qrLookup === 'ready') {
      return (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#0F7B4B]">
          <IconCheck className="h-4 w-4 shrink-0" />
          Standee found — not linked yet
        </p>
      );
    }
    if (qrCode.length === 0) {
      return <p className="mt-2 text-sm text-[#5B6474]">Printed under the QR on the standee</p>;
    }
    if (qrCode.length < 8) {
      return (
        <p className="mt-2 text-sm text-[#5B6474]">{8 - qrCode.length} more character{8 - qrCode.length === 1 ? '' : 's'}</p>
      );
    }
    if (qrLookup === 'checking') {
      return <p className="mt-2 text-sm text-[#5B6474]">Checking standee code…</p>;
    }
    if (qrLookup === 'assigned') {
      return <p className="mt-2 text-sm text-[#B45309]">This standee is already linked.</p>;
    }
    if (qrLookup === 'not_printed' || qrLookup === 'not_found') {
      return <p className="mt-2 text-sm text-[#B45309]">Standee code not found. Check the code and try again.</p>;
    }
    if (qrLookup === 'error') {
      return <p className="mt-2 text-sm text-[#B45309]">Could not verify code. Try again.</p>;
    }
    return null;
  }

  if (successSummary) {
    return <LinkSuccess summary={successSummary} onLinkAnother={resetFlow} />;
  }

  const codeInputValid = qrLookup === 'ready';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-5">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A]">Link a standee</h1>
        <p className="mt-2 text-base leading-relaxed text-[#5B6474]">
          Three quick steps to put a new standee live at the counter.
        </p>

        <ProgressSteps states={progressStates} />

        {error ? (
          <p className="mt-4 rounded-[14px] bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <StepCard step={1} title="Standee QR code" done={qrDone}>
            <StandeeQrScanner
              key={scannerEpoch}
              onScan={handleScannedRaw}
              onError={(msg) => setScanError(msg)}
            />

            {qrScanHint ? (
              <p className="mt-3 rounded-[12px] bg-amber-50 px-3 py-2 text-sm text-amber-950">{qrScanHint}</p>
            ) : null}
            {scanError ? <p className="mt-2 text-sm text-[#5B6474]">{scanError}</p> : null}

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E3E8EF]" />
              <span className="text-xs font-medium text-[#5B6474]">or type the code</span>
              <div className="h-px flex-1 bg-[#E3E8EF]" />
            </div>

            <label className="block text-sm font-medium text-[#3A4352]">
              8-character code
              <input
                className={`cs-field cs-mono mt-2 w-full py-3 text-center text-[18px] tracking-[0.18em] uppercase ${
                  codeInputValid ? 'border-[#0F7B4B]' : ''
                }`}
                value={qrCode}
                onChange={(e) => {
                  setQrCode(normalizeStandeeCode(e.target.value));
                  setQrScanHint(null);
                }}
                maxLength={8}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                aria-invalid={qrCode.length === 8 && !codeInputValid && qrLookup !== 'checking'}
              />
            </label>
            {qrHelperText()}
          </StepCard>

          <StepCard step={2} title="Google Business profile" done={placeDone}>
            <form role="search" onSubmit={searchPlaces} className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <label htmlFor="place-search" className="sr-only">Search Google Business profile</label>
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6474]" />
                <input
                  id="place-search"
                  className="cs-field cs-field--icon-start w-full"
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  placeholder="Business name, city"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="min-h-11 shrink-0 rounded-[12px] border border-[#E3E8EF] bg-white px-4 text-sm font-semibold text-[#0F172A] cs-focus disabled:opacity-50"
              >
                Search
              </button>
            </form>

            {placeResults.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6474]">
                  {placeResults.length} match{placeResults.length === 1 ? '' : 'es'} on Google
                </p>
                <div className="mt-2 space-y-2" role="radiogroup" aria-label="Google Business profile">
                  {placeResults.map((row) => (
                    <SelectableCard
                      key={row.placeId}
                      name={row.name}
                      description={row.formattedAddress ?? undefined}
                      selected={selectedPlace?.placeId === row.placeId}
                      onSelect={() => setSelectedPlace(row)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </StepCard>

          <StepCard step={3} title="Service" done={qrDone && placeDone && serviceSelected}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Service">
              {SERVICES.map((row) => (
                <SelectableCard
                  key={row.key}
                  layout="grid"
                  name={row.title}
                  description={row.subtitle}
                  selected={service === row.key}
                  onSelect={() => setService(row.key)}
                />
              ))}
            </div>
          </StepCard>
        </div>
      </main>

      <StickyActionBar disabled={!canLink} busy={busy} hint={progressHint} onAction={() => void submit()} />
    </div>
  );
}

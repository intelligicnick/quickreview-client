import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { LinkSuccess, type LinkSuccessSummary } from '../../components/counter-sale/LinkSuccess';
import { ProgressSteps, deriveStepStates } from '../../components/counter-sale/ProgressSteps';
import { SelectableCard } from '../../components/counter-sale/SelectableCard';
import { StandeeQrScanner } from '../../components/counter-sale/StandeeQrScanner';
import { StepCard } from '../../components/counter-sale/StepCard';
import { StickyActionBar } from '../../components/counter-sale/StickyActionBar';
import {
  counterSaleApi,
  CounterSaleApiError,
  getCounterSaleToken,
  redeemCounterSaleSessionTicket,
  setCounterSaleToken,
  takeCounterSaleSessionTicketFromQuery,
} from '../../lib/counter-sale-api';

type PlaceRow = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
};

type QrLookup = {
  code: string;
  status: 'ready' | 'assigned' | 'not_found' | 'not_printed';
};

type ServiceKind = 'review' | 'menu';

const STANDEE_CODE_LEN = 8;

function parseQrInput(raw: string): string {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/\/q\/([A-Za-z0-9]+)/i)?.[1];
  return (fromUrl ?? trimmed).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeStandeeCode(raw: string): string {
  return parseQrInput(raw).slice(0, STANDEE_CODE_LEN);
}

export function CounterSaleLinkPage() {
  const [token, setToken] = useState<string | null>(() => getCounterSaleToken());
  const [sessionBootstrapping, setSessionBootstrapping] = useState(
    () => Boolean(new URLSearchParams(window.location.search).get('ticket')),
  );

  useEffect(() => {
    const ticket = takeCounterSaleSessionTicketFromQuery();
    if (!ticket) {
      setToken(getCounterSaleToken());
      setSessionBootstrapping(false);
      return;
    }
    setSessionBootstrapping(true);
    void redeemCounterSaleSessionTicket(ticket)
      .then((accessToken) => {
        setCounterSaleToken(accessToken);
        setToken(accessToken);
      })
      .catch(() => setToken(null))
      .finally(() => setSessionBootstrapping(false));
  }, []);

  const [qrCode, setQrCode] = useState('');
  const [qrStatus, setQrStatus] = useState<QrLookup['status'] | null>(null);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [placeBusy, setPlaceBusy] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [service, setService] = useState<ServiceKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<LinkSuccessSummary | null>(null);

  const lookupBusy = useRef(false);
  const lookupQrRef = useRef<(code: string) => Promise<void>>(async () => {});

  const qrDone = qrStatus === 'ready';
  const placeDone = Boolean(selectedPlaceId);
  const serviceSelected = Boolean(service);
  const canLink = qrDone && placeDone && serviceSelected && !busy;
  const doneCount = (qrDone ? 1 : 0) + (placeDone ? 1 : 0) + (serviceSelected ? 1 : 0);

  const progressStates = deriveStepStates(qrDone, placeDone, serviceSelected);

  const selectedPlace = useMemo(
    () => places.find((p) => p.placeId === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  );

  const lookupQr = useCallback(async (raw: string) => {
    const code = normalizeStandeeCode(raw);
    if (code.length < 4) {
      setQrStatus(null);
      setQrMessage(null);
      return;
    }
    if (lookupBusy.current) return;
    lookupBusy.current = true;
    setQrMessage(null);
    try {
      const data = await counterSaleApi<QrLookup>(
        `/api/counter-sale/qr-codes/lookup?code=${encodeURIComponent(code)}`,
      );
      setQrCode(data.code);
      setQrStatus(data.status);
      if (data.status === 'ready') setQrMessage('Code is ready to link.');
      else if (data.status === 'assigned') setQrMessage('This code is already linked.');
      else if (data.status === 'not_printed') setQrMessage('Code is not marked printed yet.');
      else setQrMessage('Code not found.');
    } catch (err) {
      setQrStatus(null);
      setQrMessage(err instanceof CounterSaleApiError ? err.message : 'Lookup failed');
    } finally {
      lookupBusy.current = false;
    }
  }, []);

  lookupQrRef.current = lookupQr;

  useEffect(() => {
    if (qrCode.length === STANDEE_CODE_LEN) void lookupQr(qrCode);
  }, [qrCode, lookupQr]);

  useEffect(() => {
    const q = placeQuery.trim();
    if (q.length < 3) {
      setPlaces([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setPlaceBusy(true);
      try {
        const rows = await counterSaleApi<PlaceRow[]>(
          `/api/counter-sale/places/search?q=${encodeURIComponent(q)}`,
        );
        setPlaces(rows);
      } catch {
        setPlaces([]);
      } finally {
        setPlaceBusy(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [placeQuery]);

  const handleScannedRaw = useCallback(async (raw: string) => {
    const code = normalizeStandeeCode(raw);
    setQrCode(code);
    await lookupQrRef.current(code);
  }, []);

  async function linkStandee() {
    if (!canLink || !service || !selectedPlaceId) return;
    setBusy(true);
    setError(null);
    try {
      const data = await counterSaleApi<{
        summary: LinkSuccessSummary;
        business: { name: string };
      }>('/api/counter-sale/provisions', {
        method: 'POST',
        body: { qrCode, placeId: selectedPlaceId, service },
      });
      setSuccess({
        ...data.summary,
        businessName: data.summary.businessName || data.business.name || selectedPlace?.name || 'Business',
      });
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Link failed');
    } finally {
      setBusy(false);
    }
  }

  function resetFlow() {
    setSuccess(null);
    setQrCode('');
    setQrStatus(null);
    setQrMessage(null);
    setPlaceQuery('');
    setPlaces([]);
    setSelectedPlaceId(null);
    setService(null);
    setError(null);
  }

  if (sessionBootstrapping) {
    return <p className="px-4 py-6 text-sm text-[#5B6474]">Signing in…</p>;
  }

  if (!token) {
    return <Navigate to="/counter-sale/login" replace />;
  }

  if (success) {
    return <LinkSuccess summary={success} onLinkAnother={resetFlow} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A]">Link a standee</h1>
        <p className="mt-2 text-base leading-relaxed text-[#5B6474]">
          Scan the QR on the standee, match it to the Google Business profile, then pick QuickReview or QuickCommerce.
        </p>
        <ProgressSteps states={progressStates} />

        {error ? (
          <p className="mt-4 rounded-[14px] bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <StepCard step={1} title="QR code" done={qrDone}>
            <StandeeQrScanner onScan={handleScannedRaw} onError={setQrMessage} />
            <label className="mt-4 block text-sm font-medium text-[#3A4352]">
              Or enter code
              <input
                className={`cs-field cs-mono mt-2 w-full py-3 text-center text-[20px] tracking-[0.35em] ${
                  qrDone ? 'border-[#0F7B4B]' : ''
                }`}
                value={qrCode}
                onChange={(e) => setQrCode(normalizeStandeeCode(e.target.value))}
                inputMode="text"
                autoComplete="off"
                maxLength={STANDEE_CODE_LEN}
                spellCheck={false}
              />
            </label>
            {qrMessage ? (
              <p className={`mt-2 text-sm ${qrDone ? 'text-[#0F7B4B]' : 'text-[#5B6474]'}`}>{qrMessage}</p>
            ) : null}
          </StepCard>

          <StepCard step={2} title="Business" done={placeDone}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B6474]" aria-hidden />
              <input
                className="cs-field cs-field--icon-start w-full"
                placeholder="Search on Google Maps"
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  setSelectedPlaceId(null);
                }}
              />
            </div>
            {placeBusy ? <p className="mt-2 text-sm text-[#5B6474]">Searching…</p> : null}
            {places.length > 0 ? (
              <div className="mt-3 space-y-2" role="radiogroup" aria-label="Business">
                {places.map((row) => (
                  <SelectableCard
                    key={row.placeId}
                    name={row.name}
                    description={row.formattedAddress ?? undefined}
                    selected={selectedPlaceId === row.placeId}
                    onSelect={() => setSelectedPlaceId(row.placeId)}
                  />
                ))}
              </div>
            ) : null}
          </StepCard>

          <StepCard step={3} title="Service" done={qrDone && placeDone && serviceSelected}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Service">
              <SelectableCard
                layout="grid"
                name="QuickReview"
                description="Google reviews"
                selected={service === 'review'}
                onSelect={() => setService('review')}
              />
              <SelectableCard
                layout="grid"
                name="QuickCommerce"
                description="Digital menu"
                selected={service === 'menu'}
                onSelect={() => setService('menu')}
              />
            </div>
          </StepCard>
        </div>
      </div>

      <StickyActionBar
        disabled={!canLink}
        busy={busy}
        onAction={() => void linkStandee()}
        hint={
          canLink
            ? 'Ready — tap Link & activate.'
            : `${doneCount} of 3 done · complete QR, business, and service.`
        }
      />
    </div>
  );
}

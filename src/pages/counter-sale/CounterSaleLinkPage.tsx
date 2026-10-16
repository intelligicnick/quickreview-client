import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, Loader2, QrCode } from 'lucide-react';
import {
  counterSaleApi,
  CounterSaleApiError,
  getCounterSaleToken,
} from '../../lib/counter-sale-api';
import { readQrFromVideo } from '../../lib/qr-from-video';

type PlaceRow = {
  placeId: string;
  name: string;
  formattedAddress: string | null;
};

function parseQrInput(raw: string): string {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/\/q\/([A-Za-z0-9]+)/i)?.[1];
  return (fromUrl ?? trimmed).toUpperCase();
}

type QrLookupStatus = 'ready' | 'assigned' | 'not_found' | 'not_printed';

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

export function CounterSaleLinkPage() {
  const token = getCounterSaleToken();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimer = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lookupBusy = useRef(false);

  const [qrCode, setQrCode] = useState('');
  const [qrScanHint, setQrScanHint] = useState<string | null>(null);
  const [scanActive, setScanActive] = useState(false);
  const [scanStarting, setScanStarting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceRow[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceRow | null>(null);
  const [service, setService] = useState<'review' | 'menu'>('review');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (scanTimer.current != null) {
      window.clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    setScanStarting(false);
    setScanActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

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
          setQrScanHint('QR scanned — ready to assign');
          setScanError(null);
          playScanSound('success');
          stopCamera();
          return;
        }
        if (result.status === 'assigned') {
          setQrScanHint('Already assigned — scan a different QR');
          playScanSound('error');
          return;
        }
        if (result.status === 'not_printed') {
          setQrScanHint('This code is not a printed standee — scan a different QR');
          playScanSound('error');
          return;
        }
        setQrScanHint('QR code not found — scan a different QR');
        playScanSound('error');
      } catch {
        setQrScanHint('Could not verify QR — try again or enter the code manually');
        playScanSound('error');
      } finally {
        lookupBusy.current = false;
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    if (!scanActive) return;

    let cancelled = false;
    setScanStarting(true);
    setScanError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Camera scan is not supported on this browser. Enter the code manually.');
      setScanActive(false);
      setScanStarting(false);
      return;
    }

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setScanStarting(false);
        scanTimer.current = window.setInterval(() => {
          void (async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.readyState < 2) return;
            try {
              const raw = await readQrFromVideo(video, canvas);
              if (!raw) return;
              await handleScannedRaw(raw);
            } catch {
              /* keep scanning */
            }
          })();
        }, 300);
      } catch {
        if (!cancelled) {
          setScanError('Allow camera access or type the QR code below.');
          setScanActive(false);
          setScanStarting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (scanTimer.current != null) {
        window.clearInterval(scanTimer.current);
        scanTimer.current = null;
      }
    };
  }, [scanActive, stopCamera, handleScannedRaw]);

  if (!token) {
    return <Navigate to="/counter-sale/login" replace />;
  }

  function startScan() {
    setError(null);
    setScanError(null);
    setQrScanHint(null);
    setScanActive(true);
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
    if (!selectedPlace || !qrCode.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await counterSaleApi<{
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
      setSuccess(`${result.location.name} linked.${result.targetUrl ? ` Scans go to: ${result.targetUrl}` : ''}`);
      setQrCode('');
      setQrScanHint(null);
      setSelectedPlace(null);
      setPlaceResults([]);
    } catch (err) {
      setError(err instanceof CounterSaleApiError ? err.message : 'Could not link');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold">Link standee</h1>
        <p className="mt-1 text-sm text-muted">Scan the QR, pick the Google business, choose the product.</p>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {success ? (
        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Step 1 — QR code</p>
        {scanActive ? (
          <div className="relative mt-3 overflow-hidden rounded-2xl bg-ink">
            <video
              ref={videoRef}
              className="aspect-square w-full object-cover"
              muted
              playsInline
            />
            {scanStarting ? (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : null}
            <div
              className="pointer-events-none absolute inset-8 rounded-xl border-2 border-dashed border-white/70"
              aria-hidden
            />
            <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white/90">
              Point at the standee QR code
            </p>
            <canvas ref={canvasRef} className="hidden" aria-hidden />
          </div>
        ) : null}
        {qrScanHint ? (
          <p
            className={`mt-2 rounded-xl px-3 py-2 text-sm ${
              qrScanHint.startsWith('QR scanned')
                ? 'bg-emerald-50 text-emerald-900'
                : 'bg-amber-50 text-amber-950'
            }`}
          >
            {qrScanHint}
          </p>
        ) : null}
        {scanError ? <p className="mt-2 text-sm text-muted">{scanError}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {!scanActive ? (
            <button
              type="button"
              onClick={startScan}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium"
            >
              <QrCode className="h-4 w-4" />
              Scan QR
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-muted"
            >
              Cancel scan
            </button>
          )}
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-muted">Or enter code</span>
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-3 font-mono uppercase"
            value={qrCode}
            onChange={(e) => {
              setQrCode(e.target.value);
              setQrScanHint(null);
            }}
            placeholder="AB12CD34"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Step 2 — Google profile</p>
        <form onSubmit={searchPlaces} className="mt-3 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
            value={placeSearch}
            onChange={(e) => setPlaceSearch(e.target.value)}
            placeholder="Business name + city"
          />
          <button type="submit" disabled={busy} className="shrink-0 rounded-xl bg-paper px-3 py-2 text-sm font-medium">
            Search
          </button>
        </form>
        {placeResults.length > 0 ? (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {placeResults.map((row) => (
              <li key={row.placeId}>
                <button
                  type="button"
                  onClick={() => setSelectedPlace(row)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                    selectedPlace?.placeId === row.placeId ? 'bg-accent/10 ring-1 ring-accent' : 'hover:bg-paper'
                  }`}
                >
                  {row.name}
                  {row.formattedAddress ? (
                    <span className="block text-xs text-muted">{row.formattedAddress}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Step 3 — Service</p>
        <div className="mt-3 flex gap-2">
          {(['review', 'menu'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setService(key)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
                service === key ? 'bg-ink text-white' : 'border border-line'
              }`}
            >
              {key === 'review' ? 'QuickReview' : 'QuickCommerce'}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={busy || !qrCode.trim() || !selectedPlace}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Link & activate
      </button>
    </div>
  );
}

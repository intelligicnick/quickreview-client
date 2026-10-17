import { useCallback, useEffect, useRef, useState } from 'react';
import { attachStreamToVideo, cameraErrorMessage, hasCameraApi, requestQrCameraStream } from '../../lib/camera-stream';
import { readQrFromImageFile, readQrFromVideo } from '../../lib/qr-from-video';
import { IconScan } from './icons';

type StandeeQrScannerProps = {
  onScan: (raw: string) => void | Promise<void>;
  onError?: (message: string) => void;
};

type Phase = 'idle' | 'opening' | 'live';

export function StandeeQrScanner({ onScan, onError }: StandeeQrScannerProps) {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanTimer = useRef<number | null>(null);
  const openGen = useRef(0);
  const onScanRef = useRef(onScan);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [localError, setLocalError] = useState<string | null>(null);

  onScanRef.current = onScan;

  const stopStream = useCallback(() => {
    openGen.current += 1;
    if (scanTimer.current != null) {
      window.clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPhase('idle');
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const attachIfReady = useCallback(async (video: HTMLVideoElement) => {
    const stream = streamRef.current;
    if (!stream) return;
    await attachStreamToVideo(stream, video);
    setPhase('live');
  }, []);

  const setVideoNode = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (!node || !streamRef.current) return;
      void attachIfReady(node).catch((err: unknown) => {
        const msg = cameraErrorMessage(err);
        setLocalError(msg);
        onError?.(msg);
        stopStream();
      });
    },
    [attachIfReady, onError, stopStream],
  );

  function beginOpen() {
    setLocalError(null);
    if (!window.isSecureContext) {
      const msg = 'Camera needs a secure connection (HTTPS). Open the app from your HTTPS link.';
      setLocalError(msg);
      onError?.(msg);
      return;
    }
    if (!hasCameraApi()) {
      const msg = cameraErrorMessage(new Error('unsupported'));
      setLocalError(msg);
      onError?.(msg);
      return;
    }

    const gen = (openGen.current += 1);
    // getUserMedia must start in this click handler — before React state updates.
    const openPromise = requestQrCameraStream();
    setPhase('opening');

    void openPromise
      .then((stream) => {
        if (gen !== openGen.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          return attachIfReady(video);
        }
      })
      .catch((err: unknown) => {
        if (gen !== openGen.current) return;
        const msg = cameraErrorMessage(err);
        setLocalError(msg);
        onError?.(msg);
        stopStream();
      });
  }

  useEffect(() => {
    if (phase !== 'live') return;

    scanTimer.current = window.setInterval(() => {
      void (async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;
        try {
          const raw = await readQrFromVideo(video, canvas);
          if (!raw) return;
          await onScanRef.current(raw);
        } catch {
          /* keep scanning */
        }
      })();
    }, 300);

    return () => {
      if (scanTimer.current != null) {
        window.clearInterval(scanTimer.current);
        scanTimer.current = null;
      }
    };
  }, [phase]);

  async function onPhotoPicked(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    try {
      const raw = await readQrFromImageFile(file);
      if (!raw) {
        const msg = 'No QR code found in that photo. Try again with the standee in frame.';
        setLocalError(msg);
        onError?.(msg);
        return;
      }
      await onScanRef.current(raw);
    } catch {
      const msg = 'Could not read that photo. Try again.';
      setLocalError(msg);
      onError?.(msg);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (phase === 'idle') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={beginOpen}
          className="flex min-h-16 w-full items-center gap-3 rounded-[14px] bg-[#1A5FD6] px-4 text-left text-white cs-focus"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/20">
            <IconScan />
          </span>
          <span>
            <span className="block text-base font-semibold">Scan standee QR</span>
            <span className="mt-0.5 block text-sm text-white/90">Point the camera at the standee</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-11 w-full rounded-[12px] border border-[#E3E8EF] text-sm font-semibold text-[#3A4352] cs-focus"
        >
          Take photo of QR
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void onPhotoPicked(e.target.files?.[0])}
        />
        {localError ? <p className="text-sm text-[#B45309]">{localError}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[14px] bg-[#0F172A]">
        <video
          ref={setVideoNode}
          className="aspect-[4/3] w-full object-cover"
          muted
          playsInline
          autoPlay
        />
        {phase === 'opening' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A]/60">
            <p className="text-sm font-medium text-white">Opening camera…</p>
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute inset-5 rounded-[12px] border-2 border-dashed border-white/70"
          aria-hidden
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden />
      </div>
      <button
        type="button"
        onClick={stopStream}
        className="min-h-11 w-full rounded-[12px] border border-[#E3E8EF] text-sm font-semibold text-[#5B6474] cs-focus"
      >
        Cancel scan
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="min-h-11 w-full text-sm font-semibold text-[#1A5FD6] cs-focus"
      >
        Take photo of QR instead
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void onPhotoPicked(e.target.files?.[0])}
      />
      {localError ? <p className="text-sm text-[#B45309]">{localError}</p> : null}
    </div>
  );
}

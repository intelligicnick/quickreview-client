import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';

type CardCameraCaptureProps = {
  active: boolean;
  sideLabel: string;
  onCapture: (file: File) => void;
  onError: (message: string) => void;
};

export function CardCameraCapture({ active, sideLabel, onCapture, onError }: CardCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!active) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    let cancelled = false;
    setStarting(true);

    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStarting(false);
        onErrorRef.current('Camera not supported in this browser — use upload instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 4096 },
            height: { ideal: 2160 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch {
        onErrorRef.current('Allow camera access to scan the card, or upload a photo.');
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [active]);

  function snapFromVideo() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      onError('Camera not ready — wait a moment and try again.');
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    const minEdge = Math.min(w, h);
    const upscale = minEdge > 0 && minEdge < 1600 ? 1600 / minEdge : 1;
    canvas.width = Math.round(w * upscale);
    canvas.height = Math.round(h * upscale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError('Could not capture photo');
          return;
        }
        onCapture(new File([blob], `card-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.97,
    );
  }

  function onFilePicked(file: File | undefined) {
    if (!file) return;
    onCapture(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold">{sideLabel}</p>
      <div className="relative mt-2 overflow-hidden rounded-2xl bg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
        />
        {starting ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/70"
          aria-hidden
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <button
        type="button"
        disabled={starting || !active}
        onClick={() => snapFromVideo()}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-60"
      >
        <Camera className="h-4 w-4" />
        Capture photo
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-muted"
      >
        <ImagePlus className="h-4 w-4" />
        Upload from gallery
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFilePicked(e.target.files?.[0])}
      />
    </div>
  );
}

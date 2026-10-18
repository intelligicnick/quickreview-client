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
      <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
        {sideLabel}
      </p>
      <div className="mx-auto w-full max-w-[440px]">
        <div className="relative overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} playsInline muted className="aspect-[1.75/1] w-full object-cover" />
          {starting ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6" aria-hidden>
            <div className="relative h-full w-full max-h-[85%] max-w-full">
              <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white" />
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <button
        type="button"
        disabled={starting || !active}
        onClick={() => snapFromVideo()}
        className="mx-auto mt-4 flex min-h-11 w-full max-w-[440px] items-center justify-center gap-2 rounded-[10px] bg-brand text-sm font-semibold text-white disabled:opacity-60"
      >
        <Camera className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
        Capture photo
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mx-auto mt-2 flex w-full max-w-[440px] items-center justify-center gap-2 py-2 text-sm font-semibold text-muted"
      >
        <ImagePlus className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
        Upload from gallery
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFilePicked(e.target.files?.[0])}
      />
      <p className="mt-3 text-center text-xs text-muted">OCR runs in your browser — nothing is uploaded until you save to CRM.</p>
    </div>
  );
}

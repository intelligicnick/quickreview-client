import { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, Sparkles } from 'lucide-react';
import {
  canvasToBlob,
  cropCanvas,
  defaultCropRect,
  enhanceForOcr,
  imageToCanvas,
  loadImageFromFile,
  rotateCanvas,
  type CropRect,
} from '../../lib/quickscan/image-process';

type CardImageEditorProps = {
  file: File;
  label: string;
  onConfirm: (processed: Blob, previewUrl: string, originalUrl: string) => void;
  onCancel: () => void;
};

export function CardImageEditor({ file, label, onConfirm, onCancel }: CardImageEditorProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [enhanced, setEnhanced] = useState(true);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const img = await loadImageFromFile(file);
      if (cancelled) return;
      const canvas = imageToCanvas(img);
      baseCanvasRef.current = canvas;
      setOriginalUrl(canvas.toDataURL('image/jpeg', 0.9));
      setCrop(defaultCropRect(canvas));
      setRotation(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    const base = baseCanvasRef.current;
    if (!base || !crop) return;
    let working = base;
    if (rotation % 360 !== 0) {
      const step = ((rotation % 360) + 360) % 360;
      if (step === 90) working = rotateCanvas(working, 90);
      else if (step === 180) working = rotateCanvas(working, 180);
      else if (step === 270) working = rotateCanvas(working, 270);
    }
    const cropped = cropCanvas(working, crop);
    const finalCanvas = enhanced ? enhanceForOcr(cropped) : cropped;
    setPreviewUrl(finalCanvas.toDataURL('image/png'));
  }, [rotation, enhanced, crop]);

  async function handleConfirm() {
    const base = baseCanvasRef.current;
    if (!base || !crop || !previewUrl || !originalUrl) return;
    let working = base;
    const step = ((rotation % 360) + 360) % 360;
    if (step === 90) working = rotateCanvas(working, 90);
    else if (step === 180) working = rotateCanvas(working, 180);
    else if (step === 270) working = rotateCanvas(working, 270);
    const cropped = cropCanvas(working, crop);
    const finalCanvas = enhanced ? enhanceForOcr(cropped) : cropped;
    const blob = await canvasToBlob(finalCanvas, 'image/png');
    onConfirm(blob, previewUrl, originalUrl);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!crop) return;
    setDrag({ x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || !crop) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    setDrag({ x: e.clientX, y: e.clientY });
    setCrop((prev: CropRect | null) =>
      prev
        ? {
            ...prev,
            x: prev.x + dx * 0.5,
            y: prev.y + dy * 0.5,
          }
        : prev,
    );
  }

  function onPointerUp() {
    setDrag(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted">
        Adjust crop (drag image), rotate, and enhance contrast before OCR. Original is kept for
        comparison.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Original</p>
          {originalUrl ? (
            <img src={originalUrl} alt="Original card" className="mt-2 max-h-48 w-full rounded-xl object-contain" />
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Processed preview</p>
          <div
            className="relative mt-2 overflow-hidden rounded-xl border border-line bg-paper"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Processed card preview" className="max-h-48 w-full object-contain" />
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRotation((r) => r - 90)}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Rotate left
        </button>
        <button
          type="button"
          onClick={() => setRotation((r) => r + 90)}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Rotate right
        </button>
        <button
          type="button"
          onClick={() => setEnhanced((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
            enhanced ? 'border-brand bg-brand/5 text-brand' : 'border-line'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Auto enhance {enhanced ? 'on' : 'off'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={!previewUrl}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Continue to OCR
        </button>
      </div>
    </div>
  );
}

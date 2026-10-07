/** Canvas helpers: rotate, crop, contrast — no external services. */

export type CropRect = { x: number; y: number; width: number; height: number };

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return loadImageFromFile(new File([blob], 'card.png', { type: blob.type || 'image/png' }));
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type, quality);
  });
}

export function rotateCanvas(source: HTMLCanvasElement, degrees: 90 | 180 | 270): HTMLCanvasElement {
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  const w = source.width;
  const h = source.height;
  if (degrees === 180) {
    out.width = w;
    out.height = h;
    ctx.translate(w, h);
    ctx.rotate(Math.PI);
    ctx.drawImage(source, 0, 0);
    return out;
  }
  out.width = h;
  out.height = w;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2);
  return out;
}

export function imageToCanvas(img: HTMLImageElement, maxEdge = 2400): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export function cropCanvas(source: HTMLCanvasElement, rect: CropRect): HTMLCanvasElement {
  const x = Math.max(0, Math.min(source.width - 1, Math.round(rect.x)));
  const y = Math.max(0, Math.min(source.height - 1, Math.round(rect.y)));
  const width = Math.max(8, Math.min(source.width - x, Math.round(rect.width)));
  const height = Math.max(8, Math.min(source.height - y, Math.round(rect.height)));
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  ctx?.drawImage(source, x, y, width, height, 0, 0, width, height);
  return out;
}

/** Grayscale + mild contrast stretch for OCR. */
export function enhanceForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const { data } = imageData;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
    data[i] = data[i + 1] = data[i + 2] = gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }
  const span = Math.max(1, max - min);
  for (let i = 0; i < data.length; i += 4) {
    const stretched = Math.round(((data[i]! - min) / span) * 255);
    data[i] = data[i + 1] = data[i + 2] = stretched;
  }
  ctx.putImageData(imageData, 0, 0);
  return out;
}

export function defaultCropRect(canvas: HTMLCanvasElement): CropRect {
  const insetX = canvas.width * 0.04;
  const insetY = canvas.height * 0.06;
  return {
    x: insetX,
    y: insetY,
    width: canvas.width - insetX * 2,
    height: canvas.height - insetY * 2,
  };
}

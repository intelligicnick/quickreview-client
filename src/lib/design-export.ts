import {
  drawPosterOverlay,
  themeOnPhoto,
  type CompositedExportInput,
  type PosterOverlayTheme,
} from './design-poster-overlay';

export type ExportAspect = '9:16' | '1:1' | '4:5';

function exportSize(ratio: ExportAspect, longEdge = 1080): [number, number] {
  if (ratio === '1:1') return [longEdge, longEdge];
  if (ratio === '4:5') return [longEdge, Math.round((longEdge * 5) / 4)];
  return [longEdge, Math.round((longEdge * 16) / 9)];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

async function renderCompositedCanvas(input: CompositedExportInput): Promise<HTMLCanvasElement> {
  const img = await loadImage(input.imageUrl);
  const [width, height] = exportSize(input.ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  drawCover(ctx, img, width, height);
  drawPosterOverlay(ctx, width, height, input.text, themeOnPhoto(input.theme), {
    photoBackground: true,
  });
  return canvas;
}

export async function compositedPosterBlob(input: CompositedExportInput): Promise<Blob> {
  const canvas = await renderCompositedCanvas(input);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Export failed');
  return blob;
}

export async function downloadCompositedPoster(
  input: CompositedExportInput,
  filename: string,
): Promise<void> {
  const blob = await compositedPosterBlob(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Background only — prefer downloadCompositedPoster when text should appear on the image. */
export async function downloadImageAtRatio(
  imageUrl: string,
  ratio: ExportAspect,
  filename: string,
): Promise<void> {
  const img = await loadImage(imageUrl);
  const [width, height] = exportSize(ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);
  drawCover(ctx, img, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Export failed');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type { PosterOverlayTheme };

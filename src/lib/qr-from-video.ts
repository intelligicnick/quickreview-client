import jsQR from 'jsqr';

/** Read one QR payload from a live video frame (iOS Safari has no BarcodeDetector). */
export async function readQrFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  if ('BarcodeDetector' in window) {
    try {
      const codes = await new BarcodeDetector({ formats: ['qr_code'] }).detect(video);
      return codes[0]?.rawValue ?? null;
    } catch {
      /* fall through to jsQR */
    }
  }

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const maxDim = 720;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const cw = Math.floor(w * scale);
  const ch = Math.floor(h * scale);
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;
  ctx.drawImage(video, 0, 0, cw, ch);
  const imageData = ctx.getImageData(0, 0, cw, ch);
  return jsQR(imageData.data, cw, ch)?.data ?? null;
}

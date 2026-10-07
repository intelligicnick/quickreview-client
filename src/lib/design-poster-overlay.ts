import type { ExportAspect } from './design-export';

export type PosterOverlayTheme = {
  headline: string;
  subhead: string;
  scope: string;
  footer: string;
  badgeBg: string;
  badgeText: string;
};

export type PosterOverlayText = {
  headline: string;
  subhead: string;
  badge: string;
  scope: string;
  businessName: string | null;
  phone: string | null;
};

/** Readable text on top of a photo background. */
export function themeOnPhoto(theme: PosterOverlayTheme): PosterOverlayTheme {
  return {
    headline: '#fffbeb',
    subhead: 'rgba(255, 251, 235, 0.9)',
    scope: 'rgba(255, 251, 235, 0.78)',
    footer: '#fef3c7',
    badgeBg: theme.badgeBg,
    badgeText: theme.badgeText,
  };
}

function drawPhotoScrim(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
  gradient.addColorStop(0.42, 'rgba(0, 0, 0, 0.12)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.78)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${line} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

export function drawPosterOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: PosterOverlayText,
  theme: PosterOverlayTheme,
  options: { photoBackground: boolean },
): void {
  if (options.photoBackground) {
    drawPhotoScrim(ctx, width, height);
  }

  const padX = width * 0.08;
  const maxText = width - padX * 2;
  let y = height * 0.1;

  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.headline;
  ctx.font = `800 ${Math.round(width * 0.105)}px system-ui, -apple-system, Segoe UI, sans-serif`;
  for (const line of wrapLines(ctx, text.headline, maxText)) {
    ctx.fillText(line, padX, y);
    y += width * 0.11;
  }

  y += height * 0.01;
  ctx.fillStyle = theme.subhead;
  ctx.font = `500 ${Math.round(width * 0.042)}px system-ui, -apple-system, Segoe UI, sans-serif`;
  for (const line of wrapLines(ctx, text.subhead, maxText)) {
    ctx.fillText(line, padX, y);
    y += width * 0.05;
  }

  const bottomBlock = height * 0.72;
  const badgeFont = Math.round(width * 0.048);
  ctx.font = `800 ${badgeFont}px system-ui, -apple-system, Segoe UI, sans-serif`;
  const badgePadX = width * 0.035;
  const badgePadY = height * 0.012;
  const badgeW = ctx.measureText(text.badge).width + badgePadX * 2;
  const badgeH = badgeFont + badgePadY * 2;
  const badgeX = padX;
  const badgeY = bottomBlock;
  ctx.fillStyle = theme.badgeBg;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, width * 0.02);
  ctx.fill();
  ctx.fillStyle = theme.badgeText;
  ctx.fillText(text.badge, badgeX + badgePadX, badgeY + badgePadY);

  let footerY = badgeY + badgeH + height * 0.02;
  ctx.fillStyle = theme.scope;
  ctx.font = `600 ${Math.round(width * 0.032)}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillText(text.scope.toUpperCase(), padX, footerY);
  footerY += width * 0.05;

  if (text.businessName) {
    ctx.fillStyle = theme.footer;
    ctx.font = `700 ${Math.round(width * 0.04)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillText(text.businessName, padX, footerY);
    footerY += width * 0.048;
  }
  if (text.phone) {
    ctx.fillStyle = theme.subhead;
    ctx.font = `400 ${Math.round(width * 0.034)}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillText(text.phone, padX, footerY);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export type CompositedExportInput = {
  imageUrl: string;
  ratio: ExportAspect;
  text: PosterOverlayText;
  theme: PosterOverlayTheme;
};

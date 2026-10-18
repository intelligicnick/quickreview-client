import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export type QrPrintSheetRow = {
  code: string;
  link: string;
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const COLS = 2;
const ROWS = 4;
const MARK_RATIO = 0.17;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function qrDataUrl(link: string, px: number, logo: HTMLImageElement): Promise<string> {
  const qrUrl = await QRCode.toDataURL(link, {
    width: px,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#101828', light: '#ffffff' },
  });
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  const qrImg = await loadImage(qrUrl);
  ctx.drawImage(qrImg, 0, 0, px, px);
  const mark = Math.max(16, Math.round(px * MARK_RATIO));
  ctx.drawImage(logo, (px - mark) / 2, (px - mark) / 2, mark, mark);
  return canvas.toDataURL('image/png');
}

export async function downloadQrPrintSheetPdf(
  rows: QrPrintSheetRow[],
  fileName: string,
): Promise<void> {
  if (!rows.length) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const usableW = PAGE_W - MARGIN * 2;
  const usableH = PAGE_H - MARGIN * 2;
  const cellW = usableW / COLS;
  const cellH = usableH / ROWS;
  const qrSize = Math.min(cellW - 8, cellH - 28, 42);
  const qrPx = Math.round(qrSize * 11);
  const logo = await loadImage('/logo-q.png');

  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && i % (COLS * ROWS) === 0) {
      doc.addPage();
    }
    const pageIndex = i % (COLS * ROWS);
    const col = pageIndex % COLS;
    const row = Math.floor(pageIndex / COLS);
    const x = MARGIN + col * cellW + (cellW - qrSize) / 2;
    const y = MARGIN + row * cellH + 4;

    const { code, link } = rows[i]!;
    const dataUrl = await qrDataUrl(link, qrPx, logo);
    doc.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize);

    const textX = MARGIN + col * cellW + cellW / 2;
    const codeY = y + qrSize + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(code, textX, codeY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const urlLines = doc.splitTextToSize(link, cellW - 6);
    doc.text(urlLines, textX, codeY + 4.5, { align: 'center', maxWidth: cellW - 6 });
  }

  doc.save(fileName);
}

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

async function qrDataUrl(link: string, px: number): Promise<string> {
  return QRCode.toDataURL(link, {
    width: px,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  });
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
    const dataUrl = await qrDataUrl(link, qrPx);
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

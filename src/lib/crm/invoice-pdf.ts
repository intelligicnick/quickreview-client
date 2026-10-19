import { jsPDF } from 'jspdf';
import type { Customer, Quotation } from './types';
import { formatInr, formatShortDate } from './format';

export function downloadInvoicePdf(doc: Quotation, customer: Customer): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const lineNames = doc.lines.map((l) => l.name).join(', ');
  pdf.setFontSize(18);
  pdf.text(doc.number, 20, 24);
  pdf.setFontSize(11);
  pdf.text(customer.name, 20, 34);
  if (customer.company) pdf.text(customer.company, 20, 40);
  pdf.text(`Issued ${formatShortDate(doc.createdAt)}`, 20, 48);
  pdf.text(lineNames || 'Invoice', 20, 58);
  pdf.setFontSize(14);
  pdf.text(`Total ${formatInr(doc.total)}`, 20, 72);
  pdf.save(`${doc.number}.pdf`);
}

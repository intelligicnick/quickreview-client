import type { CrmState, Customer } from './types';
import { formatInr } from './format';

export type SearchHit =
  | { type: 'customer'; customer: Customer; subtitle: string }
  | { type: 'quotation'; customer: Customer; amount: number; quotationId: string }
  | { type: 'sale'; customer: Customer; title: string; amount: number; saleId: string };

export function searchCrm(state: CrmState, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];
  const customerById = new Map(state.customers.map((c) => [c.id, c]));

  for (const customer of state.customers) {
    const blob = [customer.name, customer.company, customer.mobile, customer.email]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (blob.includes(q)) {
      hits.push({
        type: 'customer',
        customer,
        subtitle: [customer.company, customer.mobile].filter(Boolean).join(' · '),
      });
    }
  }

  for (const quotation of state.quotations) {
    const customer = customerById.get(quotation.customerId);
    if (!customer) continue;
    const amountStr = formatInr(quotation.total).toLowerCase();
    if (customer.name.toLowerCase().includes(q) || amountStr.includes(q) || q.includes('quote')) {
      hits.push({
        type: 'quotation',
        customer,
        amount: quotation.total,
        quotationId: quotation.id,
      });
    }
  }

  for (const sale of state.sales) {
    const customer = customerById.get(sale.customerId);
    if (!customer) continue;
    if (
      customer.name.toLowerCase().includes(q) ||
      sale.title.toLowerCase().includes(q) ||
      String(sale.amount).includes(q)
    ) {
      hits.push({
        type: 'sale',
        customer,
        title: sale.title,
        amount: sale.amount,
        saleId: sale.id,
      });
    }
  }

  return hits.slice(0, 20);
}

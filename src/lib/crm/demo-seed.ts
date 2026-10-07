import type { CrmState } from './types';
import * as store from './store';

/** Sample data for first-time empty workspaces (ponytail: client-only demo). */
export function seedDemoIfEmpty(state: CrmState): boolean {
  if (state.customers.length > 0) return false;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const rahul = store.addCustomer(state, {
    name: 'Rahul Sharma',
    mobile: '9876543210',
    company: 'ABC Enterprises',
    customerType: 'Business',
    notes: 'Website development enquiry',
    status: 'quotation',
  });

  store.addCatalogItem(state, {
    kind: 'service',
    name: 'Website Development',
    price: 25000,
    taxPercent: 18,
    unit: 'project',
    description: 'Business website',
  });

  store.createQuotation(state, {
    customerId: rahul.id,
    discount: 0,
    lines: [{ name: 'Website Development', quantity: 1, unitPrice: 25000, taxPercent: 18 }],
  });

  store.addFollowUp(state, {
    customerId: rahul.id,
    dueAt: tomorrow.toISOString(),
    reason: 'Quotation',
  });

  const priya = store.addCustomer(state, {
    name: 'Priya Mehta',
    mobile: '9123456780',
    company: 'Mehta Traders',
    status: 'interested',
  });

  store.createSale(state, {
    customerId: priya.id,
    title: 'Bulk order',
    amount: 50000,
    stage: 'negotiation',
  });
  const sale = state.sales.find((s) => s.customerId === priya.id);
  if (sale) store.recordPayment(state, { saleId: sale.id, amount: 20000 });

  return true;
}

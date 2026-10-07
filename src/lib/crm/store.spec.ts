import assert from 'node:assert/strict';
import * as store from './store';

const s = store.emptyState();
const c = store.addCustomer(s, { name: 'Test', mobile: '9000000000' });
store.createQuotation(s, {
  customerId: c.id,
  discount: 0,
  lines: [{ name: 'Item', quantity: 1, unitPrice: 1000, taxPercent: 18 }],
});
assert.equal(s.customers[0].status, 'quotation');
assert.equal(s.quotations[0].total, 1180);
assert.equal(s.quotations[0].documentType, 'quotation');
const inv = store.convertQuotationToInvoice(s, s.quotations[0].id);
assert.ok(inv?.documentType === 'invoice');
store.recordPayment(s, { saleId: s.sales[0].id, amount: 1180 });
assert.equal(s.sales[0].stage, 'won');
console.log('crm store self-check ok');

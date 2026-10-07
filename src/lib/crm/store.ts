import { mergeCommerceCatalog, type CommerceCategory } from './commerce-sync';
import type {
  Activity,
  ActivityKind,
  CatalogItem,
  CrmProfile,
  CrmState,
  Customer,
  DealStage,
  DocumentType,
  FollowUp,
  Payment,
  Quotation,
  QuotationLine,
  Sale,
} from './types';

export function emptyState(): CrmState {
  return {
    profile: null,
    customers: [],
    followUps: [],
    catalog: [],
    quotations: [],
    sales: [],
    payments: [],
    activities: [],
    commerceSync: { lastSyncedAt: null, locationId: null, itemCount: 0 },
  };
}

function nextDocNumber(state: CrmState, documentType: DocumentType): string {
  const prefix = documentType === 'invoice' ? 'INV' : 'QT';
  const count = state.quotations.filter((q) => q.documentType === documentType).length + 1;
  return `${prefix}-${String(count).padStart(4, '0')}`;
}

export function migrateState(state: CrmState): void {
  if (!state.commerceSync) {
    state.commerceSync = { lastSyncedAt: null, locationId: null, itemCount: 0 };
  }
  let qt = 0;
  let inv = 0;
  for (const q of state.quotations) {
    if (!q.documentType) q.documentType = 'quotation';
    if (!q.status) q.status = 'sent';
    if (!q.number) {
      if (q.documentType === 'invoice') {
        inv += 1;
        q.number = `INV-${String(inv).padStart(4, '0')}`;
      } else {
        qt += 1;
        q.number = `QT-${String(qt).padStart(4, '0')}`;
      }
    }
  }
}

function id(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function lineTotal(line: QuotationLine): number {
  const sub = line.quantity * line.unitPrice;
  return sub + sub * (line.taxPercent / 100);
}

export function quotationTotal(lines: QuotationLine[], discount: number): number {
  const sum = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  return Math.max(0, sum - discount);
}

function addActivity(
  state: CrmState,
  customerId: string,
  kind: ActivityKind,
  title: string,
  detail?: string,
  amount?: number,
): Activity {
  const activity: Activity = {
    id: id(),
    customerId,
    kind,
    title,
    detail,
    amount,
    createdAt: now(),
  };
  state.activities.unshift(activity);
  return activity;
}

export function setProfile(state: CrmState, profile: CrmProfile): void {
  state.profile = { ...profile, onboardedAt: profile.onboardedAt || now() };
}

export function addCustomer(
  state: CrmState,
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: DealStage },
): Customer {
  const customer: Customer = {
    id: id(),
    status: input.status ?? 'new',
    createdAt: now(),
    updatedAt: now(),
    ...input,
  };
  state.customers.unshift(customer);
  addActivity(state, customer.id, 'enquiry', 'Enquiry received', input.notes);
  const deal = ensureDealForCustomer(state, customer.id, input.company || 'Enquiry');
  deal.stage = customer.status;
  return customer;
}

export function updateCustomer(state: CrmState, customerId: string, patch: Partial<Customer>): Customer | null {
  const customer = state.customers.find((c) => c.id === customerId);
  if (!customer) return null;
  Object.assign(customer, patch, { updatedAt: now() });
  return customer;
}

function findSaleForCustomer(state: CrmState, customerId: string): Sale | undefined {
  return state.sales.find((s) => s.customerId === customerId && s.stage !== 'won' && s.stage !== 'lost');
}

export function ensureDealForCustomer(state: CrmState, customerId: string, title: string): Sale {
  const existing = findSaleForCustomer(state, customerId);
  if (existing) return existing;
  const sale: Sale = {
    id: id(),
    customerId,
    title,
    amount: 0,
    received: 0,
    stage: 'new',
    createdAt: now(),
  };
  state.sales.unshift(sale);
  return sale;
}

export function addFollowUp(
  state: CrmState,
  input: { customerId: string; dueAt: string; reason: string },
): FollowUp {
  const followUp: FollowUp = {
    id: id(),
    customerId: input.customerId,
    dueAt: input.dueAt,
    reason: input.reason,
    createdAt: now(),
  };
  state.followUps.unshift(followUp);
  const customer = state.customers.find((c) => c.id === input.customerId);
  addActivity(
    state,
    input.customerId,
    'follow_up',
    `Follow-up scheduled: ${input.reason}`,
    `Due ${new Date(input.dueAt).toLocaleString('en-IN')}`,
  );
  if (customer && customer.status === 'new') {
    customer.status = 'interested';
    customer.updatedAt = now();
    const deal = ensureDealForCustomer(state, customer.id, input.reason);
    deal.stage = 'interested';
  }
  return followUp;
}

export function completeFollowUp(state: CrmState, followUpId: string): void {
  const fu = state.followUps.find((f) => f.id === followUpId);
  if (!fu || fu.completedAt) return;
  fu.completedAt = now();
  addActivity(state, fu.customerId, 'follow_up', 'Follow-up completed', fu.reason);
}

export function rescheduleFollowUp(state: CrmState, followUpId: string, dueAt: string): void {
  const fu = state.followUps.find((f) => f.id === followUpId);
  if (!fu) return;
  fu.dueAt = dueAt;
  fu.completedAt = undefined;
}

export function addNote(state: CrmState, customerId: string, text: string): void {
  addActivity(state, customerId, 'note', text);
}

export function logCall(state: CrmState, customerId: string): void {
  addActivity(state, customerId, 'call', 'Called customer');
}

export function addCatalogItem(state: CrmState, item: Omit<CatalogItem, 'id'>): CatalogItem {
  const row: CatalogItem = { id: id(), ...item };
  state.catalog.unshift(row);
  return row;
}

export function createQuotation(
  state: CrmState,
  input: { customerId: string; lines: QuotationLine[]; discount: number },
): Quotation {
  const total = quotationTotal(input.lines, input.discount);
  const deal = ensureDealForCustomer(state, input.customerId, input.lines[0]?.name || 'Quotation');
  deal.stage = 'quotation';
  deal.amount = total;
  const customer = state.customers.find((c) => c.id === input.customerId);
  if (customer) {
    customer.status = 'quotation';
    customer.updatedAt = now();
  }
  const quotation: Quotation = {
    id: id(),
    customerId: input.customerId,
    dealId: deal.id,
    lines: input.lines,
    discount: input.discount,
    total,
    createdAt: now(),
    documentType: 'quotation',
    status: 'sent',
    number: nextDocNumber(state, 'quotation'),
  };
  state.quotations.unshift(quotation);
  addActivity(
    state,
    input.customerId,
    'quotation',
    `Quotation ${quotation.number} · ${formatInrActivity(total)}`,
    undefined,
    total,
  );
  return quotation;
}

export function convertQuotationToInvoice(state: CrmState, quotationId: string): Quotation | null {
  const quote = state.quotations.find((q) => q.id === quotationId && q.documentType === 'quotation');
  if (!quote) return null;
  quote.status = 'accepted';
  const invoice: Quotation = {
    id: id(),
    customerId: quote.customerId,
    dealId: quote.dealId,
    lines: structuredClone(quote.lines),
    discount: quote.discount,
    total: quote.total,
    createdAt: now(),
    documentType: 'invoice',
    status: 'sent',
    number: nextDocNumber(state, 'invoice'),
    sourceQuotationId: quote.id,
  };
  state.quotations.unshift(invoice);
  const deal = state.sales.find((s) => s.id === quote.dealId);
  if (deal) {
    deal.amount = invoice.total;
    deal.stage = 'negotiation';
  }
  addActivity(
    state,
    quote.customerId,
    'sale',
    `Invoice ${invoice.number} · ${formatInrActivity(invoice.total)}`,
    `From ${quote.number}`,
    invoice.total,
  );
  return invoice;
}

export function markInvoicePaid(state: CrmState, invoiceId: string): void {
  const invoice = state.quotations.find((q) => q.id === invoiceId && q.documentType === 'invoice');
  if (!invoice || invoice.status === 'paid') return;
  invoice.status = 'paid';
  const sale = state.sales.find((s) => s.id === invoice.dealId);
  if (sale) {
    if (sale.amount <= 0) sale.amount = invoice.total;
    const due = Math.max(0, sale.amount - sale.received);
    const pay = due > 0 ? due : invoice.total;
    recordPayment(state, { saleId: sale.id, amount: pay, note: invoice.number });
    sale.stage = 'won';
  }
  const customer = state.customers.find((c) => c.id === invoice.customerId);
  if (customer) {
    customer.status = 'won';
    customer.updatedAt = now();
  }
}

export function syncCommerceCatalog(
  state: CrmState,
  categories: CommerceCategory[],
  locationId: string,
): { added: number; updated: number } {
  return mergeCommerceCatalog(state, categories, locationId);
}

function formatInrActivity(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function createSale(
  state: CrmState,
  input: { customerId: string; title: string; amount: number; expectedDate?: string; stage?: DealStage },
): Sale {
  const deal = ensureDealForCustomer(state, input.customerId, input.title);
  deal.title = input.title;
  deal.amount = input.amount;
  deal.expectedDate = input.expectedDate;
  deal.stage = input.stage ?? deal.stage;
  if (input.stage === 'won') {
    const customer = state.customers.find((c) => c.id === input.customerId);
    if (customer) {
      customer.status = 'won';
      customer.updatedAt = now();
    }
  }
  addActivity(state, input.customerId, 'sale', input.title, formatInrActivity(input.amount), input.amount);
  return deal;
}

export function setDealStage(state: CrmState, saleId: string, stage: DealStage): void {
  const sale = state.sales.find((s) => s.id === saleId);
  if (!sale) return;
  sale.stage = stage;
  const customer = state.customers.find((c) => c.id === sale.customerId);
  if (customer) {
    customer.status = stage;
    customer.updatedAt = now();
  }
}

export function recordPayment(
  state: CrmState,
  input: { saleId: string; amount: number; note?: string },
): Payment | null {
  const sale = state.sales.find((s) => s.id === input.saleId);
  if (!sale) return null;
  sale.received += input.amount;
  const payment: Payment = {
    id: id(),
    saleId: sale.id,
    customerId: sale.customerId,
    amount: input.amount,
    paidAt: now(),
    note: input.note,
  };
  state.payments.unshift(payment);
  addActivity(
    state,
    sale.customerId,
    'payment',
    `Payment received ${formatInrActivity(input.amount)}`,
    input.note,
    input.amount,
  );
  if (sale.received >= sale.amount && sale.amount > 0) {
    sale.stage = 'won';
    const customer = state.customers.find((c) => c.id === sale.customerId);
    if (customer) {
      customer.status = 'won';
      customer.updatedAt = now();
    }
  }
  return payment;
}

export function persistKey(workspaceId: string): string {
  return `quickcrm_v1_${workspaceId}`;
}

export function loadState(workspaceId: string): CrmState {
  try {
    const raw = localStorage.getItem(persistKey(workspaceId));
    if (!raw) return emptyState();
    const state = { ...emptyState(), ...JSON.parse(raw) } as CrmState;
    migrateState(state);
    return state;
  } catch {
    return emptyState();
  }
}

export function saveState(workspaceId: string, state: CrmState): void {
  localStorage.setItem(persistKey(workspaceId), JSON.stringify(state));
}

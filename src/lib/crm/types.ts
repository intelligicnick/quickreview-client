export type BusinessType =
  | 'retail'
  | 'restaurant'
  | 'service'
  | 'agency'
  | 'professional'
  | 'manufacturer'
  | 'distributor'
  | 'freelancer'
  | 'other';

export type DealStage = 'new' | 'interested' | 'quotation' | 'negotiation' | 'won' | 'lost';

export type PaymentStatus = 'paid' | 'partial' | 'pending';

export type CatalogKind = 'product' | 'service';

export type ActivityKind =
  | 'enquiry'
  | 'note'
  | 'call'
  | 'follow_up'
  | 'quotation'
  | 'sale'
  | 'payment'
  | 'whatsapp';

export type CrmProfile = {
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  mobile: string;
  goals: ('customers' | 'sales' | 'followups' | 'payments')[];
  onboardedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  company?: string;
  email?: string;
  customerType?: string;
  notes?: string;
  status: DealStage;
  createdAt: string;
  updatedAt: string;
};

export type FollowUp = {
  id: string;
  customerId: string;
  dueAt: string;
  reason: string;
  completedAt?: string;
  createdAt: string;
};

export type CatalogItem = {
  id: string;
  kind: CatalogKind;
  name: string;
  description?: string;
  price: number;
  taxPercent: number;
  unit: string;
  /** Quick Commerce menu item id when synced */
  commerceItemId?: string;
  commerceCategory?: string;
};

export type DocStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'cancelled';

export type DocumentType = 'quotation' | 'invoice';

export type QuotationLine = {
  catalogItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
};

export type Quotation = {
  id: string;
  customerId: string;
  dealId?: string;
  lines: QuotationLine[];
  discount: number;
  createdAt: string;
  total: number;
  documentType: DocumentType;
  status: DocStatus;
  number: string;
  /** Set when invoice was created from a quotation */
  sourceQuotationId?: string;
};

export type CommerceSyncMeta = {
  lastSyncedAt: string | null;
  locationId: string | null;
  itemCount: number;
};

export type Sale = {
  id: string;
  customerId: string;
  dealId?: string;
  title: string;
  amount: number;
  received: number;
  expectedDate?: string;
  stage: DealStage;
  createdAt: string;
};

export type Payment = {
  id: string;
  saleId: string;
  customerId: string;
  amount: number;
  paidAt: string;
  note?: string;
};

export type Activity = {
  id: string;
  customerId: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  amount?: number;
  createdAt: string;
  meta?: Record<string, string>;
};

export type CrmState = {
  profile: CrmProfile | null;
  customers: Customer[];
  followUps: FollowUp[];
  catalog: CatalogItem[];
  quotations: Quotation[];
  sales: Sale[];
  payments: Payment[];
  activities: Activity[];
  commerceSync: CommerceSyncMeta;
};

export type FieldConfidence = 'low' | 'medium' | 'high';

export type QuickScanContact = {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  namePrefix: string | null;
  nameSuffix: string | null;
  company: string | null;
  jobTitle: string | null;
  department: string | null;
  mobiles: string[];
  workPhones: string[];
  homePhones: string[];
  fax: string | null;
  whatsapp: string | null;
  emails: string[];
  websites: string[];
  addressStreet: string | null;
  addressLocality: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
  addressFull: string | null;
  socialLinks: string[];
  services: string[];
  products: string[];
  notes: string | null;
  rawOcrText: string;
  fieldConfidence: Partial<Record<string, FieldConfidence>>;
};

export function emptyQuickScanContact(): QuickScanContact {
  return {
    fullName: null,
    firstName: null,
    lastName: null,
    namePrefix: null,
    nameSuffix: null,
    company: null,
    jobTitle: null,
    department: null,
    mobiles: [],
    workPhones: [],
    homePhones: [],
    fax: null,
    whatsapp: null,
    emails: [],
    websites: [],
    addressStreet: null,
    addressLocality: null,
    addressCity: null,
    addressState: null,
    addressPostal: null,
    addressCountry: null,
    addressFull: null,
    socialLinks: [],
    services: [],
    products: [],
    notes: null,
    rawOcrText: '',
    fieldConfidence: {},
  };
}

export type QuickScanHistoryRow = {
  id: string;
  scannedAt: string;
  contact: QuickScanContact;
};

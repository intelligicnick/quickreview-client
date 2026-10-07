import type { BusinessType } from './types';

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  retail: 'Retail',
  restaurant: 'Restaurant',
  service: 'Service Business',
  agency: 'Agency',
  professional: 'Professional Services',
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  freelancer: 'Freelancer',
  other: 'Other',
};

export function catalogLabel(type: BusinessType | undefined): string {
  switch (type) {
    case 'restaurant':
      return 'Menu items';
    case 'service':
    case 'agency':
    case 'professional':
    case 'freelancer':
      return 'Services';
    case 'retail':
    case 'manufacturer':
    case 'distributor':
      return 'Products';
    default:
      return 'Products & Services';
  }
}

export function salesLabel(type: BusinessType | undefined): string {
  switch (type) {
    case 'agency':
      return 'Projects';
    case 'service':
      return 'Jobs';
    case 'restaurant':
      return 'Orders';
    default:
      return 'Sales';
  }
}

export const DEAL_STAGE_LABELS: Record<import('./types').DealStage, string> = {
  new: 'New',
  interested: 'Interested',
  quotation: 'Quotation',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

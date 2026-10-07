export const CRM_BASE = '/app/quickcrm';

export function crmPath(segment = ''): string {
  if (!segment) return CRM_BASE;
  return `${CRM_BASE}${segment.startsWith('/') ? segment : `/${segment}`}`;
}

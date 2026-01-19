export type ClientAccess = {
  name: string;
  email: string;
};

export type ClientRecord = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  customText: string;
  tagline: string;
  ctaColors: string[];
  logoPreviews: string[];
  notes: string;
  accessList: ClientAccess[];
  createdAt: string;
};

export const CLIENT_STORAGE_KEY = 'driversklub_clients';

export function getClientInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean);
  const initials = parts.map((p) => p[0]).join('');
  return (initials || 'CL').slice(0, 2).toUpperCase();
}

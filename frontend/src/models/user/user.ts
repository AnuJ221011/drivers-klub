export type UserRole = 'SUPER_ADMIN' | 'FLEET_ADMIN' | 'MANAGER' | 'OPERATIONS' | 'DRIVER';

export type User = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  fleetId?: string | null;
  hubIds?: string[];
  /** Backend: `User.isActive` is non-nullable boolean */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
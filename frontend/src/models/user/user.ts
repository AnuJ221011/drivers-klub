export type UserRole = 'SUPER_ADMIN' | 'FLEET_ADMIN' | 'OPERATIONS' | 'MANAGER' | 'DRIVER';

export type User = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  /**
   * Optional hub assignment (backend may omit this field depending on endpoint/role).
   * For operations users we use it to show/assign hub ownership.
   */
  hubId?: string | null;
  /** Scope for admin roles (Fleet Admin / Manager / Operations) */
  fleetId?: string | null;
  /** Operations: hubs they can operate */
  hubIds?: string[];
  /** Backend: `User.isActive` is non-nullable boolean */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
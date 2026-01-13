export type UserRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'MANAGER' | 'DRIVER';

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
  /** Backend: `User.isActive` is non-nullable boolean */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type UserRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'MANAGER' | 'DRIVER';

export type User = {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  /** Backend: `User.isActive` is non-nullable boolean */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
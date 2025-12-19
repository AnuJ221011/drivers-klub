export type DriverStatus = 'ACTIVE' | 'INACTIVE';

/**
 * UI-friendly driver model used by pages/components.
 * `isActive` is non-nullable as requested.
 */
export type Driver = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
};

/**
 * Backend driver entity (Prisma Driver).
 * Keep this internal to API adapters.
 */
export type DriverEntity = {
  id: string;
  userId: string;
  fleetId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  profilePic: string | null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
};
export type DriverStatus = 'ACTIVE' | 'INACTIVE';

export type Driver = {
  id: string;
  shortId?: string | null;
  name: string;
  phone: string;
  isActive: boolean;
  isAvailable: boolean;
  hubId?: string | null;
  createdAt: string;
};


export type DriverEntity = {
  id: string;
  shortId?: string | null;
  userId: string;
  fleetId: string;
  hubId?: string | null;
  firstName: string;
  lastName: string;
  mobile: string;
  profilePic: string | null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: DriverStatus;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};
export type DriverStatus = 'ACTIVE' | 'INACTIVE';

export type Driver = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  isAvailable: boolean;
  hubId?: string | null;
  createdAt: string;
};


export type DriverEntity = {
  id: string;
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
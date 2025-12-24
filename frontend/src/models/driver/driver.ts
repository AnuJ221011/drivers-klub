export type DriverStatus = 'ACTIVE' | 'INACTIVE';

export type Driver = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
};


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
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};
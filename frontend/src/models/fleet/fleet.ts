export type FleetType = 'INDIVIDUAL' | 'COMPANY';
export type FleetStatus = 'ACTIVE' | 'INACTIVE';

export type Fleet = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string;
  dob: string | null;
  fleetType: FleetType;
  gstNumber: string | null;
  panNumber: string;
  modeId: string;
  status: FleetStatus;
  createdAt: string;
  updatedAt: string;
};
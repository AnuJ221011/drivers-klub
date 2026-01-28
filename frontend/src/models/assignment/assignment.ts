export type AssignmentStatus = 'ACTIVE' | 'ENDED';

export type AssignmentEntity = {
  id: string;
  shortId?: string | null;
  fleetId: string;
  driverId: string;
  vehicleId: string;
  status: AssignmentStatus;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
};
export type AssignmentStatus = 'ACTIVE' | 'ENDED';

export type AssignmentEntity = {
  id: string;
  fleetId: string;
  driverId: string;
  vehicleId: string;
  status: AssignmentStatus;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
};


export type TripStatus = 'CREATED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

export type TripEntity = {
  id: string;
  fleetId: string;
  driverId: string;
  vehicleId: string;
  assignmentId: string;
  pickup: string;
  drop: string | null;
  fare: number | null;
  status: TripStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};


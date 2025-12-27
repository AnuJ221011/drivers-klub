export type CheckinStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DriverCheckin = {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  fleetName: string;
  checkinTime: string;
  status: CheckinStatus;

  selfieUrl?: string;
  odometerUrl?: string;
  vehicleImages?: string[];
  documents?: string[];

  remarks?: string;
  deviceInfo?: string;

  auditTrail?: {
    action: string;
    by: string;
    at: string;
  }[];
};

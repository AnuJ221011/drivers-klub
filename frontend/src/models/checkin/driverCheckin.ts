export type CheckinStatus = "PENDING" | "APPROVED" | "REJECTED" | "CHECKED_OUT";

export type DriverCheckin = {
  id: string;
  /**
   * Driver id (UUID on backend). Needed for admin views where we want to open
   * the driver's full attendance history.
   */
  driverId?: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  fleetName: string;
  checkinTime: string;
  status: CheckinStatus;

  /**
   * Checkout fields (optional).
   * For the admin “Check-outs” tab we primarily care about:
   * - when the driver checked out
   * - odometer end + (optional) total km
   */
  checkOutTime?: string;
  odometerStart?: number;
  odometerEnd?: number;
  totalKm?: number;

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

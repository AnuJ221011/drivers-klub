import type { Fleet, FleetStatus, FleetType } from "@prisma/client";

export type CreateFleetInput = {
  name: string;
  mobile: string;
  email?: string;
  city: string;
  dob?: string;
  fleetType: FleetType;
  gstNumber?: string;
  panNumber: string;
  modeId?: string;
  panCardFile?: string;
  fleetAdminName: string;
  fleetAdminMobile: string;
};

export type CreateFleetPayload = Omit<
  CreateFleetInput,
  "panCardFile" | "fleetAdminName" | "fleetAdminMobile"
>;

export type VehicleInput = {
  vehicleId: string;
}

export type DriverInput = {
  driverId: string;
}

export type UpdateFleetStatusInput = {
  status: FleetStatus;
};

export type FleetEntity = Fleet;
export type FleetWithAdmin = Fleet & {
  fleetAdminName?: string;
  fleetAdminMobile?: string;
};

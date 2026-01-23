import type { FleetHub, Driver } from "@prisma/client";
import type { VehicleRow } from "@driversklub/database";

export type CreateFleetHubInput = {
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  hubType: string;
  hubManagerId?: string;
}

export type AssignManagerInput = {
  managerId: string;
}

export type FleetHubEntity = FleetHub;
export type VehicleEntity = VehicleRow;
export type DriverEntity = Driver;
import { FleetHub, Vehicle, Driver  } from "@prisma/client";

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
export type VehicleEntity = Vehicle;
export type DriverEntity = Driver;
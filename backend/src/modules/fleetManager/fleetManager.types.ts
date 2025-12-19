import type { FleetManager, FleetManagerStatus } from "@prisma/client";

export type CreateFleetManagerInput = {
  name: string;
  mobile: string;
  city: string;
  profilePicture?: string;
  fleetId: string;
};

export type UpdateFleetManagerStatusInput = {
  status: FleetManagerStatus;
};

export type FleetManagerEntity = FleetManager;

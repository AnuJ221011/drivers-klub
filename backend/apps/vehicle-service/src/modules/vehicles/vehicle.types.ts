import type {
  VehicleStatus,
  VehicleOwnership,
  FuelType
} from "@prisma/client";
import type { VehicleRow } from "@driversklub/database";

export type CreateVehicleInput = {
  fleetId: string;
  vehicleNumber: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleColor?: string;
  ownership: VehicleOwnership;
  fuelType: FuelType;
  permitExpiry?: string | Date;
  insuranceExpiry?: string | Date;
  fleetMobileNumber?: string;
};

export type UpdateVehicleDocsInput = {
  rcFrontImage?: string;
  rcBackImage?: string;
  permitImage?: string;
  permitExpiry?: string;
  fitnessImage?: string;
  fitnessExpiry?: string;
  insuranceImage?: string;
  insuranceExpiry?: string;
};

export type UpdateVehicleStatusInput = {
  status: VehicleStatus;
};

export type UpdateVehicleInput = {
  vehicleNumber?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  ownership?: VehicleOwnership;
  fuelType?: FuelType;
  permitExpiry?: string | Date | null;
  insuranceExpiry?: string | Date | null;
  fleetMobileNumber?: string;
};

export type VehicleEntity = VehicleRow;
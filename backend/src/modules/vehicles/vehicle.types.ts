import type {
  Vehicle,
  VehicleStatus,
  VehicleOwnership,
  FuelType
} from "@prisma/client";

export type CreateVehicleInput = {
  fleetId: string;
  vehicleNumber: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleColor?: string;
  ownership: VehicleOwnership;
  fuelType: FuelType;
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
};

export type VehicleEntity = Vehicle;

export type VehicleOwnership = 'OWNED' | 'LEASED';
export type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE';

/**
 * UI-friendly vehicle model used by pages/components.
 * `isActive` is non-nullable as requested.
 */
export type Vehicle = {
  id: string;
  number: string;
  brand: string;
  model: string;
  bodyType: string;
  fuelType: string;
  isActive: boolean;
  createdAt: string;
};

export type VehicleEntity = {
  id: string;
  fleetId: string;
  vehicleNumber: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleColor: string | null;
  ownership: VehicleOwnership;
  fuelType: FuelType;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  rcFrontImage: string | null;
  rcBackImage: string | null;
  permitImage: string | null;
  permitExpiry: string | null;
  fitnessImage: string | null;
  fitnessExpiry: string | null;
  insuranceImage: string | null;
  insuranceExpiry: string | null;
};


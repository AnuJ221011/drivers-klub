import api from './axios';
import type { Vehicle, VehicleEntity } from '../models/vehicle/vehicle';

function toUiFuelType(fuelType: VehicleEntity['fuelType']): string {
  return fuelType === 'ELECTRIC' ? 'EV' : fuelType;
}

function fromUiFuelType(fuelType: string): VehicleEntity['fuelType'] {
  return fuelType === 'EV' ? 'ELECTRIC' : (fuelType as VehicleEntity['fuelType']);
}

function toUiVehicle(entity: VehicleEntity): Vehicle {
  return {
    id: entity.id,
    number: entity.vehicleNumber,
    brand: entity.vehicleName,
    model: entity.vehicleModel,
    // Backend doesn’t have bodyType; we reuse `vehicleColor` to keep UI stable.
    bodyType: entity.vehicleColor || '-',
    fuelType: toUiFuelType(entity.fuelType),
    isActive: entity.status === 'ACTIVE',
    createdAt: entity.createdAt,
  };
}

export async function getVehiclesByFleet(fleetId: string): Promise<Vehicle[]> {
  const res = await api.get<VehicleEntity[]>(`/vehicles/fleet/${fleetId}`);
  return (res.data || []).map(toUiVehicle);
}

export type CreateVehicleInput = {
  number: string;
  brand: string;
  model: string;
  bodyType: 'SEDAN' | 'SUV' | 'HATCHBACK';
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  isActive: boolean;
};

export async function createVehicle(
  input: CreateVehicleInput & { fleetId: string },
): Promise<Vehicle> {
  const res = await api.post<VehicleEntity>('/vehicles', {
    fleetId: input.fleetId,
    vehicleNumber: input.number,
    vehicleName: input.brand,
    vehicleModel: input.model,
    // Temporary mapping to preserve UI field without changing UI:
    // store bodyType in `vehicleColor`.
    vehicleColor: input.bodyType,
    ownership: 'OWNED',
    fuelType: fromUiFuelType(input.fuelType),
    status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  });

  return toUiVehicle(res.data);
}

export type UpdateVehicleInput = {
  number?: string;
  brand?: string;
  model?: string;
  bodyType?: 'SEDAN' | 'SUV' | 'HATCHBACK';
  fuelType?: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
};

export async function updateVehicleDetails(
  vehicleId: string,
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  const patch: Record<string, unknown> = {};
  if (typeof input.number === 'string') patch.vehicleNumber = input.number;
  if (typeof input.brand === 'string') patch.vehicleName = input.brand;
  if (typeof input.model === 'string') patch.vehicleModel = input.model;
  if (typeof input.bodyType === 'string') patch.vehicleColor = input.bodyType;
  if (typeof input.fuelType === 'string') patch.fuelType = fromUiFuelType(input.fuelType);

  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}`, patch);
  return toUiVehicle(res.data);
}

export async function updateVehicleStatus(
  vehicleId: string,
  isActive: boolean,
): Promise<Vehicle> {
  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}/status`, {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  return toUiVehicle(res.data);
}
import api from './axios';
import { trackEvent } from '../utils/analytics';
import type { Vehicle, VehicleEntity, VehicleOwnership } from '../models/vehicle/vehicle';

type UiFuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'EV';

function toUiFuelType(fuelType: VehicleEntity['fuelType']): UiFuelType {
  return fuelType === 'ELECTRIC' ? 'EV' : fuelType;
}

function fromUiFuelType(fuelType: UiFuelType): VehicleEntity['fuelType'] {
  return fuelType === 'EV' ? 'ELECTRIC' : fuelType;
}

function toUiVehicle(entity: VehicleEntity): Vehicle {
  const permitExpiry = entity.permitExpiry ? String(entity.permitExpiry).slice(0, 10) : '';
  const insuranceExpiry = entity.insuranceExpiry ? String(entity.insuranceExpiry).slice(0, 10) : '';

  return {
    id: entity.id,
    number: entity.vehicleNumber,
    brand: entity.vehicleName,
    model: entity.vehicleModel,
    // Backend doesn’t have bodyType; we reuse `vehicleColor` to keep UI stable.
    bodyType: entity.vehicleColor || '-',
    fuelType: toUiFuelType(entity.fuelType),
    isActive: entity.status === 'ACTIVE',
    hubId: entity.hubId ?? null,
    createdAt: entity.createdAt,
    vehicleColor: entity.vehicleColor ?? '',
    ownership: entity.ownership,
    permitExpiry,
    insuranceExpiry,
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
  vehicleColor?: string;
  ownership: VehicleOwnership;
  fuelType: UiFuelType;
  permitExpiry?: string;
  insuranceExpiry?: string;
  fleetMobileNumber?: string;
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
    vehicleColor: input.vehicleColor || undefined,
    ownership: input.ownership,
    fuelType: fromUiFuelType(input.fuelType),
    permitExpiry: input.permitExpiry || undefined,
    insuranceExpiry: input.insuranceExpiry || undefined,
    fleetMobileNumber: input.fleetMobileNumber || undefined,
    status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  });
  trackEvent('create_vehicle', {
    fleet_id: input.fleetId,
    ownership: input.ownership,
    fuel_type: input.fuelType,
    initial_status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  });

  return toUiVehicle(res.data);
}

export type UpdateVehicleInput = {
  number?: string;
  brand?: string;
  model?: string;
  vehicleColor?: string;
  ownership?: VehicleOwnership;
  fuelType?: UiFuelType;
  permitExpiry?: string;
  insuranceExpiry?: string;
  fleetMobileNumber?: string;
};

export type UpdateVehicleDocsInput = {
  permitExpiry?: string;
  insuranceExpiry?: string;
};

export async function updateVehicleDetails(
  vehicleId: string,
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  const patch: Record<string, unknown> = {};
  if (typeof input.number === 'string') patch.vehicleNumber = input.number;
  if (typeof input.brand === 'string') patch.vehicleName = input.brand;
  if (typeof input.model === 'string') patch.vehicleModel = input.model;
  if (typeof input.vehicleColor === 'string') patch.vehicleColor = input.vehicleColor;
  if (typeof input.ownership === 'string') patch.ownership = input.ownership;
  if (typeof input.fuelType === 'string') patch.fuelType = fromUiFuelType(input.fuelType);
  if (typeof input.permitExpiry === 'string') patch.permitExpiry = input.permitExpiry;
  if (typeof input.insuranceExpiry === 'string') patch.insuranceExpiry = input.insuranceExpiry;
  if (typeof input.fleetMobileNumber === 'string') patch.fleetMobileNumber = input.fleetMobileNumber;

  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}`, patch);
  return toUiVehicle(res.data);
}

export async function updateVehicleDocs(
  vehicleId: string,
  input: UpdateVehicleDocsInput,
): Promise<Vehicle> {
  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}/docs`, input);
  return toUiVehicle(res.data);
}

export async function updateVehicleStatus(
  vehicleId: string,
  isActive: boolean,
): Promise<Vehicle> {
  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}/status`, {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  trackEvent('vehicle_status_change', {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  return toUiVehicle(res.data);
}
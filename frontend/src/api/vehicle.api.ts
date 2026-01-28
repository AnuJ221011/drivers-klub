import api from './axios';
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
  const insuranceStart = entity.insuranceStart ? String(entity.insuranceStart).slice(0, 10) : '';
  const fitnessExpiry = entity.fitnessExpiry ? String(entity.fitnessExpiry).slice(0, 10) : '';

  return {
    id: entity.id,
    shortId: entity.shortId ?? null,
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
    ownerName: entity.ownerName ?? '',
    chassisNumber: entity.chassisNumber ?? '',
    vinNumber: entity.vinNumber ?? '',
    ownership: entity.ownership,
    permitExpiry,
    fitnessExpiry,
    insuranceStart,
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
  ownerName?: string;
  fuelType: UiFuelType;
  chassisNumber?: string;
  vinNumber?: string;
  rcFrontImage?: File | string | null;
  rcBackImage?: File | string | null;
  permitImage?: File | string | null;
  permitExpiry?: string;
  fitnessImage?: File | string | null;
  fitnessExpiry?: string;
  insuranceImage?: File | string | null;
  insuranceStart?: string;
  insuranceExpiry?: string;
  fleetMobileNumber?: string;
  isActive: boolean;
};

type VehicleDocValue = File | string | null | undefined;

function normalizeVehicleDoc(value: VehicleDocValue): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function createVehicle(
  input: CreateVehicleInput & { fleetId: string },
): Promise<Vehicle> {
  const vehicleColor = normalizeOptionalString(input.vehicleColor);
  const ownerName = normalizeOptionalString(input.ownerName);
  const chassisNumber = normalizeOptionalString(input.chassisNumber);
  const vinNumber = normalizeOptionalString(input.vinNumber);
  const rcFrontImage = normalizeVehicleDoc(input.rcFrontImage);
  const rcBackImage = normalizeVehicleDoc(input.rcBackImage);
  const permitImage = normalizeVehicleDoc(input.permitImage);
  const fitnessImage = normalizeVehicleDoc(input.fitnessImage);
  const insuranceImage = normalizeVehicleDoc(input.insuranceImage);
  const fleetMobileNumber = normalizeOptionalString(input.fleetMobileNumber);
  const payload: Record<string, unknown> = {
    fleetId: input.fleetId,
    vehicleNumber: input.number,
    vehicleName: input.brand,
    vehicleModel: input.model,
    ownership: input.ownership,
    fuelType: fromUiFuelType(input.fuelType),
    status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  };
  if (vehicleColor) payload.vehicleColor = vehicleColor;
  if (ownerName) payload.ownerName = ownerName;
  if (chassisNumber) payload.chassisNumber = chassisNumber;
  if (vinNumber) payload.vinNumber = vinNumber;
  if (rcFrontImage) payload.rcFrontImage = rcFrontImage;
  if (rcBackImage) payload.rcBackImage = rcBackImage;
  if (permitImage) payload.permitImage = permitImage;
  if (fitnessImage) payload.fitnessImage = fitnessImage;
  if (insuranceImage) payload.insuranceImage = insuranceImage;
  if (input.permitExpiry) payload.permitExpiry = input.permitExpiry;
  if (input.fitnessExpiry) payload.fitnessExpiry = input.fitnessExpiry;
  if (input.insuranceStart) payload.insuranceStart = input.insuranceStart;
  if (input.insuranceExpiry) payload.insuranceExpiry = input.insuranceExpiry;
  if (fleetMobileNumber) payload.fleetMobileNumber = fleetMobileNumber;

  const res = await api.post<VehicleEntity>('/vehicles', payload);

  return toUiVehicle(res.data);
}

export type UpdateVehicleInput = {
  number?: string;
  brand?: string;
  model?: string;
  vehicleColor?: string;
  ownership?: VehicleOwnership;
  ownerName?: string;
  fuelType?: UiFuelType;
  chassisNumber?: string;
  vinNumber?: string;
  rcFrontImage?: File | string | null;
  rcBackImage?: File | string | null;
  permitImage?: File | string | null;
  permitExpiry?: string;
  fitnessImage?: File | string | null;
  fitnessExpiry?: string;
  insuranceImage?: File | string | null;
  insuranceStart?: string;
  insuranceExpiry?: string;
  fleetMobileNumber?: string;
};

export type UpdateVehicleDocsInput = {
  rcFrontImage?: File | string | null;
  rcBackImage?: File | string | null;
  permitImage?: File | string | null;
  permitExpiry?: string;
  fitnessImage?: File | string | null;
  fitnessExpiry?: string;
  insuranceImage?: File | string | null;
  insuranceStart?: string;
  insuranceExpiry?: string;
};

export async function updateVehicleDetails(
  vehicleId: string,
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  const patch: Record<string, unknown> = {};
  const number = normalizeOptionalString(input.number);
  const brand = normalizeOptionalString(input.brand);
  const model = normalizeOptionalString(input.model);
  const vehicleColor = normalizeOptionalString(input.vehicleColor);
  const ownerName = normalizeOptionalString(input.ownerName);
  const chassisNumber = normalizeOptionalString(input.chassisNumber);
  const vinNumber = normalizeOptionalString(input.vinNumber);
  const fleetMobileNumber = normalizeOptionalString(input.fleetMobileNumber);
  const rcFrontImage = normalizeVehicleDoc(input.rcFrontImage);
  const rcBackImage = normalizeVehicleDoc(input.rcBackImage);
  const permitImage = normalizeVehicleDoc(input.permitImage);
  const fitnessImage = normalizeVehicleDoc(input.fitnessImage);
  const insuranceImage = normalizeVehicleDoc(input.insuranceImage);

  if (number) patch.vehicleNumber = number;
  if (brand) patch.vehicleName = brand;
  if (model) patch.vehicleModel = model;
  if (vehicleColor) patch.vehicleColor = vehicleColor;
  if (typeof input.ownership === 'string') patch.ownership = input.ownership;
  if (ownerName) patch.ownerName = ownerName;
  if (chassisNumber) patch.chassisNumber = chassisNumber;
  if (vinNumber) patch.vinNumber = vinNumber;
  if (typeof input.fuelType === 'string') patch.fuelType = fromUiFuelType(input.fuelType);
  if (input.permitExpiry) patch.permitExpiry = input.permitExpiry;
  if (input.fitnessExpiry) patch.fitnessExpiry = input.fitnessExpiry;
  if (input.insuranceStart) patch.insuranceStart = input.insuranceStart;
  if (input.insuranceExpiry) patch.insuranceExpiry = input.insuranceExpiry;
  if (fleetMobileNumber) patch.fleetMobileNumber = fleetMobileNumber;
  if (rcFrontImage) patch.rcFrontImage = rcFrontImage;
  if (rcBackImage) patch.rcBackImage = rcBackImage;
  if (permitImage) patch.permitImage = permitImage;
  if (fitnessImage) patch.fitnessImage = fitnessImage;
  if (insuranceImage) patch.insuranceImage = insuranceImage;

  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}`, patch);
  return toUiVehicle(res.data);
}

export async function updateVehicleDocs(
  vehicleId: string,
  input: UpdateVehicleDocsInput,
): Promise<Vehicle> {
  const patch: Record<string, unknown> = {};
  const rcFrontImage = normalizeVehicleDoc(input.rcFrontImage);
  const rcBackImage = normalizeVehicleDoc(input.rcBackImage);
  const permitImage = normalizeVehicleDoc(input.permitImage);
  const fitnessImage = normalizeVehicleDoc(input.fitnessImage);
  const insuranceImage = normalizeVehicleDoc(input.insuranceImage);
  if (rcFrontImage) patch.rcFrontImage = rcFrontImage;
  if (rcBackImage) patch.rcBackImage = rcBackImage;
  if (permitImage) patch.permitImage = permitImage;
  if (input.permitExpiry) patch.permitExpiry = input.permitExpiry;
  if (fitnessImage) patch.fitnessImage = fitnessImage;
  if (input.fitnessExpiry) patch.fitnessExpiry = input.fitnessExpiry;
  if (insuranceImage) patch.insuranceImage = insuranceImage;
  if (input.insuranceStart) patch.insuranceStart = input.insuranceStart;
  if (input.insuranceExpiry) patch.insuranceExpiry = input.insuranceExpiry;

  const res = await api.patch<VehicleEntity>(`/vehicles/${vehicleId}/docs`, patch);
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
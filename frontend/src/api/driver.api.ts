import api from './axios';
import { trackEvent } from '../utils/analytics';

import type { Driver, DriverEntity } from '../models/driver/driver';

function toUiDriver(entity: DriverEntity): Driver {
  return {
    id: entity.id,
    name: `${entity.firstName} ${entity.lastName}`.trim(),
    phone: entity.mobile,
    isActive: entity.status === 'ACTIVE',
    isAvailable: Boolean(entity.isAvailable),
    hubId: entity.hubId ?? null,
    createdAt: entity.createdAt,
  };
}

export async function getDriversByFleet(fleetId: string): Promise<Driver[]> {
  const res = await api.get<DriverEntity[]>(`/drivers/fleet/${fleetId}`);
  return (res.data || []).map(toUiDriver);
}

export type CreateDriverInput = {
  name: string;
  phone: string;
  isActive: boolean;
  identityLivePhoto?: File | string | null;
  aadhaarCardFile?: File | string | null;
  panCardFile?: File | string | null;
  bankDetailsFile?: File | string | null;
  additionalDocuments?: Array<File | string>;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: 'NA' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'NA' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

type DriverDocValue = File | string | null | undefined;

function normalizeDriverDoc(value: DriverDocValue): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function normalizeDriverDocList(
  values: Array<File | string> | undefined,
): string[] | undefined {
  if (!values?.length) return undefined;
  const list = values
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * Creates:
 * 1) User (role=DRIVER)
 * 2) Driver profile for the selected fleet
 */
export async function createDriver(
  input: CreateDriverInput & { fleetId: string },
): Promise<Driver> {
  const { firstName, lastName } = splitName(input.name);

  // Create a DRIVER user first (required by backend)
  const userRes = await api.post<{ id: string }>(
    '/users',
    {
      name: input.name,
      phone: input.phone,
      role: 'DRIVER',
    },
  );

  const userId = userRes.data?.id;
  const livePhoto = normalizeDriverDoc(input.identityLivePhoto);
  const aadharFront = normalizeDriverDoc(input.aadhaarCardFile);
  const panCardImage = normalizeDriverDoc(input.panCardFile);
  const bankIdProof = normalizeDriverDoc(input.bankDetailsFile);
  const additionalDocuments = normalizeDriverDocList(input.additionalDocuments);

  const payload: Record<string, unknown> = {
    userId,
    fleetId: input.fleetId,
    firstName,
    lastName,
    mobile: input.phone,
    status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  };
  if (livePhoto) payload.livePhoto = livePhoto;
  if (aadharFront) payload.aadharFront = aadharFront;
  if (panCardImage) payload.panCardImage = panCardImage;
  if (bankIdProof) payload.bankIdProof = bankIdProof;
  if (additionalDocuments) payload.providerMetadata = { additionalDocuments };

  const res = await api.post<DriverEntity>('/drivers', payload);
  trackEvent('create_driver', {
    fleet_id: input.fleetId,
    initial_status: input.isActive ? 'ACTIVE' : 'INACTIVE',
    has_additional_documents: Boolean(additionalDocuments?.length),
  });

  return toUiDriver(res.data);
}

export type UpdateDriverInput = {
  name?: string;
  phone?: string;
  identityLivePhoto?: File | string | null;
  aadhaarCardFile?: File | string | null;
  panCardFile?: File | string | null;
  bankDetailsFile?: File | string | null;
  additionalDocuments?: Array<File | string>;
};

export async function updateDriverDetails(
  driverId: string,
  input: UpdateDriverInput,
): Promise<Driver> {
  const patch: Record<string, unknown> = {};
  if (typeof input.name === 'string') {
    const { firstName, lastName } = splitName(input.name);
    patch.firstName = firstName;
    patch.lastName = lastName;
  }
  if (typeof input.phone === 'string') patch.mobile = input.phone;
  const livePhoto = normalizeDriverDoc(input.identityLivePhoto);
  const aadharFront = normalizeDriverDoc(input.aadhaarCardFile);
  const panCardImage = normalizeDriverDoc(input.panCardFile);
  const bankIdProof = normalizeDriverDoc(input.bankDetailsFile);
  const additionalDocuments = normalizeDriverDocList(input.additionalDocuments);
  if (livePhoto) patch.livePhoto = livePhoto;
  if (aadharFront) patch.aadharFront = aadharFront;
  if (panCardImage) patch.panCardImage = panCardImage;
  if (bankIdProof) patch.bankIdProof = bankIdProof;
  if (additionalDocuments) patch.providerMetadata = { additionalDocuments };

  const res = await api.patch<DriverEntity>(`/drivers/${driverId}`, patch);
  return toUiDriver(res.data);
}

export async function updateDriverStatus(
  driverId: string,
  isActive: boolean,
): Promise<Driver> {
  const res = await api.patch<DriverEntity>(`/drivers/${driverId}/status`, {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  trackEvent('driver_status_change', {
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  });
  return toUiDriver(res.data);
}

export async function updateDriverAvailability(
  driverId: string,
  isAvailable: boolean,
): Promise<Driver> {
  const res = await api.patch<DriverEntity>(`/drivers/${driverId}/availability`, {
    isAvailable,
  });
  trackEvent('driver_availability_change', {
    is_available: isAvailable,
  });
  return toUiDriver(res.data);
}
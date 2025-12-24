import api from './axios';

import type { Driver, DriverEntity } from '../models/driver/driver';

function toUiDriver(entity: DriverEntity): Driver {
  return {
    id: entity.id,
    name: `${entity.firstName} ${entity.lastName}`.trim(),
    phone: entity.mobile,
    isActive: entity.status === 'ACTIVE',
    isAvailable: Boolean(entity.isAvailable),
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
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: 'NA' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'NA' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
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
  const res = await api.post<DriverEntity>('/drivers', {
    userId,
    fleetId: input.fleetId,
    firstName,
    lastName,
    mobile: input.phone,
    status: input.isActive ? 'ACTIVE' : 'INACTIVE',
  });

  return toUiDriver(res.data);
}

export type UpdateDriverInput = {
  name?: string;
  phone?: string;
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
  return toUiDriver(res.data);
}

export async function updateDriverAvailability(
  driverId: string,
  isAvailable: boolean,
): Promise<Driver> {
  const res = await api.patch<DriverEntity>(`/drivers/${driverId}/availability`, {
    isAvailable,
  });
  return toUiDriver(res.data);
}
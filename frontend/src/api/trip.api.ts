import api from './axios';
import type { TripEntity } from '../models/trip/trip';
import type { TripAssignmentEntity } from './assignment.api';

type AdminTripsResponse =
  | { trips: TripEntity[]; total?: number; page?: number; limit?: number }
  | TripEntity[];

/**
 * Admin trips list.
 * Backend: GET /admin/trips  -> { trips, total, page, limit }
 */
export async function getTrips(): Promise<TripEntity[]> {
  const res = await api.get<AdminTripsResponse>('/admin/trips');
  const data = res.data;
  if (Array.isArray(data)) return data;
  return data?.trips || [];
}

export async function getTripsByFleet(fleetId: string): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>(`/trips/${fleetId}`);
  return res.data;
}

export async function createTrip(input: {
  tripType: string;
  originCity: string;
  destinationCity?: string;
  tripDate: string; // ISO datetime
  distanceKm?: number;
}): Promise<TripEntity> {
  const res = await api.post<TripEntity>('/trips', input);
  return res.data;
}

export async function getTripById(id: string): Promise<TripEntity> {
  const res = await api.get<TripEntity>(`/trips/${id}`);
  return res.data;
}

/**
 * Manual dispatch (admin).
 * Backend: POST /admin/trips/assign { tripId, driverId } -> { assignment }
 */
export async function assignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<{ assignment: TripAssignmentEntity }>(`/admin/trips/assign`, { tripId, driverId });
  return res.data.assignment;
}

export async function unassignTripDriver(tripId: string): Promise<unknown> {
  // Backend: POST /admin/trips/unassign { tripId }
  const res = await api.post<unknown>(`/admin/trips/unassign`, { tripId });
  return res.data;
}

/**
 * Swap driver (admin).
 * Backend: POST /admin/trips/reassign { tripId, driverId } -> { assignment }
 */
export async function reassignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<{ assignment: TripAssignmentEntity }>(`/admin/trips/reassign`, { tripId, driverId });
  return res.data.assignment;
}
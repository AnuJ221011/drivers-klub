import api from './axios';
import type { TripEntity } from '../models/trip/trip';
import type { TripAssignmentEntity } from './assignment.api';

export async function getTrips(): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>('/trips');
  return res.data;
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

export async function assignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<TripAssignmentEntity>(`/trips/${tripId}/assign`, { driverId });
  return res.data;
}

export async function unassignTripDriver(tripId: string): Promise<unknown> {
  const res = await api.post<unknown>(`/trips/${tripId}/unassign`);
  return res.data;
}

export async function reassignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<TripAssignmentEntity>(`/trips/${tripId}/reassign`, { driverId });
  return res.data;
}
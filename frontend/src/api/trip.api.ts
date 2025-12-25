import api from './axios';
import type { TripEntity } from '../models/trip/trip';

export async function getTrips(): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>('/trips');
  return res.data;
}

export async function getTripsByFleet(fleetId: string): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>(`/trips/${fleetId}`);
  return res.data;
}

export async function createTrip(input: { assignmentId: string; pickup: string; drop?: string }): Promise<TripEntity> {
  const res = await api.post<TripEntity>('/trips', input);
  return res.data;
}

export async function getTripById(id: string): Promise<TripEntity> {
  const res = await api.get<TripEntity>(`/trips/${id}`);
  return res.data;
}

export type TripAssignmentEntity = {
  id: string;
  driverId: string;
  vehicleId: string;
  status?: string;
  startTime?: string;
  endTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getTripAssignments(id: string): Promise<TripAssignmentEntity[]> {
  const res = await api.get<TripAssignmentEntity[]>(`/trips/${id}/assignments`);
  return res.data;
}

export async function assignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<TripAssignmentEntity>(`/trips/${tripId}/assign`, { driverId });
  return res.data;
}

export async function reassignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<TripAssignmentEntity>(`/trips/${tripId}/reassign`, { driverId });
  return res.data;
}
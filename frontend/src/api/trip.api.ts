import api from './axios';
import type { TripEntity } from '../models/trip/trip';

export async function getTripsByFleet(fleetId: string): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>(`/trips/fleet/${fleetId}`);
  return res.data;
}

export async function assignDriverToTrip(tripId: string, driverId: string): Promise<TripEntity> {
  const res = await api.post<TripEntity>(`/trips/${tripId}/assign`, { driverId });
  return res.data;
}

export async function updateTripStatus(tripId: string, status: TripEntity['status']): Promise<TripEntity> {
  const res = await api.patch<TripEntity>(`/trips/${tripId}/status`, { status });
  return res.data;
}
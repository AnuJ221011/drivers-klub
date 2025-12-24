import api from './axios';
import type { TripEntity } from '../models/trip/trip';

export async function getTripsByFleet(fleetId: string): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>(`/trips/${fleetId}`);
  return res.data;
}

export async function createTrip(input: { assignmentId: string; pickup: string; drop?: string }): Promise<TripEntity> {
  const res = await api.post<TripEntity>('/trips', input);
  return res.data;
}
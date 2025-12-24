import api from './axios';
import type { TripEntity } from '../models/trip/trip';

export type AdminTripsResponse = {
  trips: TripEntity[];
  total: number;
  page: number;
  limit: number;
};

export async function getAdminTrips(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AdminTripsResponse> {
  const res = await api.get<AdminTripsResponse>('/admin/trips', { params });
  return res.data;
}

export async function createTrip(input: { assignmentId: string; pickup: string; drop?: string }): Promise<TripEntity> {
  const res = await api.post<TripEntity>('/trips', input);
  return res.data;
}
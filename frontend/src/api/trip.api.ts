import api from './axios';
import type { TripEntity } from '../models/trip/trip';
import type { TripAssignmentEntity } from './assignment.api';

type AdminTripsResponse =
  | { trips: TripEntity[]; total?: number; page?: number; limit?: number }
  | TripEntity[];


export async function getTrips(params?: { page?: number; limit?: number; status?: string }): Promise<TripEntity[]> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', String(params.status));

  const url = qs.toString() ? `/admin/trips?${qs.toString()}` : '/admin/trips';
  const res = await api.get<AdminTripsResponse>(url);
  const data = res.data;
  if (Array.isArray(data)) return data;
  console.log('Fetched admin trips:', data);
  return data?.trips || [];
}

export type AdminTripsPage = {
  trips: TripEntity[];
  total?: number;
  page?: number;
  limit?: number;
};

export async function getAdminTripsPage(params?: { page?: number; limit?: number; status?: string }): Promise<AdminTripsPage> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', String(params.status));

  const url = qs.toString() ? `/admin/trips?${qs.toString()}` : '/admin/trips';
  const res = await api.get<AdminTripsResponse>(url);
  const data = res.data;
  if (Array.isArray(data)) return { trips: data };
  return {
    trips: data?.trips || [],
    total: data?.total,
    page: data?.page,
    limit: data?.limit,
  };
}

export async function getTripsByFleet(fleetId: string): Promise<TripEntity[]> {
  const res = await api.get<TripEntity[]>(`/trips/${fleetId}`);
  return res.data;
}

export type TripLocationInput = {
  address: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  description?: string;
};

export type LegacyCreateTripInput = {
  distanceKm: number;
  bookingDate: string; // ISO datetime
  tripDate: string; // ISO datetime
  originCity: string;
  destinationCity?: string;
  pickupLocation?: string;
  dropLocation?: string;
  tripType: string;
  vehicleSku: string;
};

export type NewCreateTripInput = {
  pickupLocation: string | TripLocationInput;
  dropLocation: string | TripLocationInput;
  pickupTime: string; // ISO datetime
  passengerName?: string;
  passengerPhone?: string;
  vehicleType?: string;
  bookingType?: "PREBOOK" | "INSTANT";
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  distanceKm?: number;
  bookingDate?: string;
  tripDate?: string;
  originCity?: string;
  destinationCity?: string;
  tripType?: string;
  vehicleSku?: string;
};

export type CreateTripInput = LegacyCreateTripInput | NewCreateTripInput;

export async function createTrip(input: CreateTripInput): Promise<TripEntity> {
  const res = await api.post<TripEntity>('/trips', input);
  return res.data;
}

export async function getTripById(id: string): Promise<TripEntity> {
  const res = await api.get<TripEntity>(`/trips/${id}`);
  console.log('Fetched trip by ID:', res.data);
  return res.data;
}

export async function assignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<{ assignment: TripAssignmentEntity }>(`/admin/trips/assign`, { tripId, driverId });
  return res.data.assignment;
}

export async function unassignTripDriver(tripId: string): Promise<unknown> {
  // Backend: POST /admin/trips/unassign { tripId }
  const res = await api.post<unknown>(`/admin/trips/unassign`, { tripId });
  return res.data;
}

export async function reassignTripDriver(tripId: string, driverId: string): Promise<TripAssignmentEntity> {
  const res = await api.post<{ assignment: TripAssignmentEntity }>(`/admin/trips/reassign`, { tripId, driverId });
  console.log('Reassigned trip driver response:', res.data);
  return res.data.assignment;
}
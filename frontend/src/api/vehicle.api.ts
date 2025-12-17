import api from './axios';
import type { Driver } from './driver.api';

export type Vehicle = {
  id: string;
  number: string;
  brand: string;
  model: string;
  bodyType: string;
  fuelType: string;
  isActive: boolean;
  createdAt: string;
  driverId?: string | null;
  driver?: Driver;
};

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await api.get<Vehicle[]>('/api/vehicles');
  return res.data;
}

export type CreateVehicleInput = {
  number: string;
  brand: string;
  model: string;
  bodyType: 'SEDAN' | 'SUV' | 'HATCHBACK';
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  isActive?: boolean;
};

export type CreateVehicleResponse = {
  message: string;
  vehicle: Vehicle;
};

export async function createVehicle(input: CreateVehicleInput): Promise<CreateVehicleResponse> {
  const res = await api.post<CreateVehicleResponse>('/api/vehicles', input);
  return res.data;
}

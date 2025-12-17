import api from './axios';

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
  driver?: unknown;
};

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await api.get<Vehicle[]>('/api/vehicles');
  return res.data;
}


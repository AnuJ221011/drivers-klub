import api from './axios';

export type Driver = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
};

export async function getDrivers(): Promise<Driver[]> {
  const res = await api.get<Driver[]>('/api/drivers');
  return res.data;
}

export type CreateDriverInput = {
  name: string;
  phone: string;
};

export type CreateDriverResponse = {
  message: string;
  driver: Driver;
};

export async function createDriver(input: CreateDriverInput): Promise<CreateDriverResponse> {
  const res = await api.post<CreateDriverResponse>('/api/drivers', input);
  return res.data;
}

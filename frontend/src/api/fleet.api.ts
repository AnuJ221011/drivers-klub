import api from './axios';
import type { Fleet } from '../models/fleet/fleet';

export type CreateFleetInput = {
  name: string;
  mobile: string;
  email?: string;
  city: string;
  dob?: string;
  fleetType: Fleet['fleetType'];
  gstNumber?: string;
  panNumber: string;
  modeId: string;
};

export async function getFleets(): Promise<Fleet[]> {
  const res = await api.get<Fleet[]>('/fleets');
  return res.data;
}

export async function getFleetById(id: string): Promise<Fleet> {
  const res = await api.get<Fleet>(`/fleets/${id}`);
  return res.data;
}

export async function createFleet(input: CreateFleetInput): Promise<Fleet> {
  const res = await api.post<Fleet>('/fleets', input);
  return res.data;
}

export async function deactivateFleet(id: string): Promise<Fleet> {
  const res = await api.patch<Fleet>(`/fleets/${id}/deactivate`);
  return res.data;
}
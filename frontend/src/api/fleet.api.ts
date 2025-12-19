import api from './axios';
import type { Fleet } from '../models/fleet/fleet';

export async function getFleets(): Promise<Fleet[]> {
  const res = await api.get<Fleet[]>('/fleets');
  return res.data;
}

export async function getFleetById(id: string): Promise<Fleet> {
  const res = await api.get<Fleet>(`/fleets/${id}`);
  return res.data;
}
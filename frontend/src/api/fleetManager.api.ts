import api from './axios';

export type FleetManagerEntity = {
  id: string;
  name: string;
  mobile: string;
  city: string;
  profilePicture?: string | null;
  fleetId: string;
  role?: 'MANAGER' | 'FLEET_ADMIN' | (string & {});
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

export async function getFleetManagersByFleet(fleetId: string): Promise<FleetManagerEntity[]> {
  const res = await api.get<FleetManagerEntity[]>(`/fleet-managers/fleet/${fleetId}`);
  return res.data;
}

export async function createFleetManager(input: {
  fleetId: string;
  name: string;
  mobile: string;
  city: string;
  profilePicture?: string;
}): Promise<FleetManagerEntity> {
  const res = await api.post<FleetManagerEntity>('/fleet-managers', input);
  return res.data;
}

export async function deactivateFleetManager(id: string): Promise<FleetManagerEntity> {
  const res = await api.patch<FleetManagerEntity>(`/fleet-managers/${id}/deactivate`);
  return res.data;
}

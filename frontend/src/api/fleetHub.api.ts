import api from './axios';

export type FleetHubEntity = {
  id: string;
  shortId?: string | null;
  fleetId: string;
  location: unknown;
  address: string;
  hubType: string;
  hubManagerId?: string | null;
  // Some backends may return a nested relation instead of hubManagerId
  hubManager?: { id: string } | null;
};

export type HubLocation = { lat: number; lng: number };

export function parseHubLocation(value: unknown): HubLocation | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const lat = v.lat;
  const lng = v.lng;
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
  return null;
}

export async function getFleetHubs(fleetId: string): Promise<FleetHubEntity[]> {
  const res = await api.get<FleetHubEntity[]>(`/fleets/${fleetId}/hubs`);
  return res.data;
}

export type CreateFleetHubInput = {
  location: HubLocation;
  address: string;
  hubType: string;
  hubManagerId?: string;
};

export async function createFleetHub(fleetId: string, input: CreateFleetHubInput): Promise<FleetHubEntity> {
  const res = await api.post<FleetHubEntity>(`/fleets/${fleetId}/hubs`, input);
  return res.data;
}

export async function getFleetHubById(hubId: string): Promise<FleetHubEntity> {
  const res = await api.get<FleetHubEntity>(`/fleets/hubs/${hubId}`);
  return res.data;
}

export async function addVehicleToHub(hubId: string, vehicleId: string) {
  const res = await api.post(`/fleets/hubs/${hubId}/add-vehicle`, { vehicleId });
  return res.data;
}

export async function removeVehicleFromHub(hubId: string, vehicleId: string) {
  const res = await api.post(`/fleets/hubs/${hubId}/remove-vehicle`, { vehicleId });
  return res.data;
}

export async function addDriverToHub(hubId: string, driverId: string) {
  const res = await api.post(`/fleets/hubs/${hubId}/add-driver`, { driverId });
  return res.data;
}

export async function removeDriverFromHub(hubId: string, driverId: string) {
  const res = await api.post(`/fleets/hubs/${hubId}/remove-driver`, { driverId });
  return res.data;
}
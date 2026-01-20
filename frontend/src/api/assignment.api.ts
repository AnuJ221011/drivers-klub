import api from './axios';
import { trackEvent } from '../utils/analytics';
import type { AssignmentEntity } from '../models/assignment/assignment';

export async function getAssignmentsByFleet(fleetId: string): Promise<AssignmentEntity[]> {
  const res = await api.get<AssignmentEntity[]>(`/assignments/fleet/${fleetId}`);
  return res.data;
}

/**
 * Trip-wise assignments (who is assigned to this trip right now).
 * Backend: GET /trips/:id/assignments
 */
export type TripAssignmentEntity = {
  id: string;
  driverId: string;
  vehicleId: string;
  status?: string;
  startTime?: string;
  endTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAssignmentsByTrip(tripId: string): Promise<TripAssignmentEntity[]> {
  const res = await api.get<TripAssignmentEntity[]>(`/assignments/trip/${tripId}`);
  return res.data;
}

export async function createAssignment(input: {
  fleetId: string;
  driverId: string;
  vehicleId: string;
}): Promise<AssignmentEntity> {
  const res = await api.post<AssignmentEntity>('/assignments', input);
  trackEvent('create_assignment', {
    fleet_id: input.fleetId,
  });
  return res.data;
}

export async function endAssignment(id: string): Promise<AssignmentEntity> {
  const res = await api.patch<AssignmentEntity>(`/assignments/${id}/end`);
  trackEvent('end_assignment', {});
  return res.data;
}
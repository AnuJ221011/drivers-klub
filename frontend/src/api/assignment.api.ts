import api from './axios';
import type { AssignmentEntity } from '../models/assignment/assignment';

export async function getAssignmentsByFleet(fleetId: string): Promise<AssignmentEntity[]> {
  const res = await api.get<AssignmentEntity[]>(`/assignments/fleet/${fleetId}`);
  return res.data;
}

export async function createAssignment(input: {
  fleetId: string;
  driverId: string;
  vehicleId: string;
}): Promise<AssignmentEntity> {
  const res = await api.post<AssignmentEntity>('/assignments', input);
  return res.data;
}

export async function endAssignment(id: string): Promise<AssignmentEntity> {
  const res = await api.patch<AssignmentEntity>(`/assignments/${id}/end`);
  return res.data;
}


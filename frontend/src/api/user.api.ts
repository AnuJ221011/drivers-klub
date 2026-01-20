import api from './axios';
import { trackEvent } from '../utils/analytics';
import type { User, UserRole } from '../models/user/user';

export async function getUsers(): Promise<User[]> {
  const res = await api.get<User[]>('/users');
  return res.data;
}

export async function getUserById(id: string): Promise<User> {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
}

export async function createUser(input: {
  name: string;
  phone: string;
  role: UserRole;
  isActive?: boolean;
  fleetId?: string | null;
  hubIds?: string[];
}): Promise<User> {
  // Backend DTO doesn't include isActive, but Prisma allows it and backend forwards req.body.
  const res = await api.post<User>('/users', input);
  trackEvent('create_team_member', {
    role: input.role,
    has_fleet: Boolean(input.fleetId),
    hub_count: input.hubIds?.length ?? 0,
  });
  return res.data;
}

export async function updateUser(
  id: string,
  input: Partial<{
    name: string;
    role: UserRole;
    isActive: boolean;
    fleetId: string | null;
    hubIds: string[];
  }>,
): Promise<User> {
  const res = await api.patch<User>(`/users/${id}`, input);
  trackEvent('update_team_member', {
    role: input.role,
    is_active: input.isActive,
    has_fleet: input.fleetId !== undefined ? Boolean(input.fleetId) : undefined,
    hub_count: input.hubIds?.length,
  });
  return res.data;
}

export async function deactivateUser(id: string): Promise<User> {
  const res = await api.patch<User>(`/users/${id}/deactivate`);
  trackEvent('deactivate_team_member', {});
  return res.data;
}
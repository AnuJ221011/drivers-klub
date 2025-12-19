import api from './axios';
import type { User, UserRole } from '../models/user/user';

export async function getUsers(): Promise<User[]> {
  const res = await api.get<User[]>('/users');
  return res.data;
}

export async function getUserById(id: string): Promise<User> {
  const res = await api.get<User>(`/users/${id}`);
  return res.data;
}

export async function createUser(input: { name: string; phone: string; role: UserRole; isActive?: boolean }): Promise<User> {
  // Backend DTO doesn't include isActive, but Prisma allows it and backend forwards req.body.
  const res = await api.post<User>('/users', input);
  return res.data;
}

export async function deactivateUser(id: string): Promise<User> {
  const res = await api.patch<User>(`/users/${id}/deactivate`);
  return res.data;
}


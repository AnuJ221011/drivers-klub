import api from './axios';
import type { AttendanceEntity, AttendanceStatus, Paginated } from '../models/attendance/attendance';

export type ListAttendanceParams = {
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
  driverId?: string;
  fleetId?: string;
};

export async function listAttendance(params: ListAttendanceParams = {}): Promise<Paginated<AttendanceEntity>> {
  const res = await api.get<Paginated<AttendanceEntity>>('/attendance', { params });
  return res.data;
}

export type AttendanceHistoryParams = {
  page?: number;
  limit?: number;
  driverId?: string;
  fleetId?: string;
};

export async function getAttendanceHistory(params: AttendanceHistoryParams = {}): Promise<Paginated<AttendanceEntity>> {
  const res = await api.get<Paginated<AttendanceEntity>>('/attendance/history', { params });
  return res.data;
}

export async function approveAttendance(id: string, remarks?: string): Promise<AttendanceEntity> {
  const res = await api.post<AttendanceEntity>(`/attendance/${id}/approve`, remarks ? { remarks } : {});
  return res.data;
}

export async function rejectAttendance(id: string, remarks?: string): Promise<AttendanceEntity> {
  const res = await api.post<AttendanceEntity>(`/attendance/${id}/reject`, remarks ? { remarks } : {});
  return res.data;
}

export type CheckInInput = {
  // for admin/testing only; drivers can omit this (backend derives from JWT)
  driverId?: string;
  lat?: number;
  lng?: number;
  odometer?: number;
  selfieUrl?: string;
};

export async function checkIn(input: CheckInInput = {}): Promise<AttendanceEntity> {
  const res = await api.post<AttendanceEntity>('/attendance/check-in', input);
  return res.data;
}

export type CheckOutInput = {
  // for admin/testing only; drivers can omit this (backend derives from JWT)
  driverId?: string;
  odometer?: number;
};

export async function checkOut(input: CheckOutInput = {}): Promise<AttendanceEntity> {
  const res = await api.post<AttendanceEntity>('/attendance/check-out', input);
  return res.data;
}


import api from './axios';
import type { DriverCheckin, CheckinStatus } from '../models/checkin/driverCheckin';

type AttendanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_OUT';

type AttendanceEntity = {
  id: string;
  driverId: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  approvedBy?: string | null;
  adminRemarks?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  selfieUrl?: string | null;
  odometerStart?: number | null;
  odometerEnd?: number | null;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    fleet?: { id: string; name: string } | null;
    assignments?: Array<{
      id: string;
      status: string;
      vehicle?: { id: string; vehicleNumber: string; vehicleName?: string; vehicleModel?: string } | null;
    }>;
  } | null;
};

type AttendanceHistoryEnvelope = {
  data: AttendanceEntity[];
  total: number;
  page: number;
  limit: number;
};

function toCheckinStatus(status: AttendanceStatus): CheckinStatus {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  // Treat CHECKED_OUT as approved-ish for the admin UI badge.
  return 'PENDING';
}

function toUiCheckin(entity: AttendanceEntity): DriverCheckin {
  const driver = entity.driver;
  const name = driver ? `${driver.firstName} ${driver.lastName}`.trim() : '-';
  const phone = driver?.mobile || '-';
  const fleetName = driver?.fleet?.name || '-';
  const activeVehicleNumber = driver?.assignments?.[0]?.vehicle?.vehicleNumber || '-';

  return {
    id: entity.id,
    driverName: name,
    driverPhone: phone,
    vehicleNumber: activeVehicleNumber,
    fleetName,
    checkinTime: entity.checkInTime,
    status: toCheckinStatus(entity.status),
    selfieUrl: entity.selfieUrl || undefined,
    remarks: entity.adminRemarks || undefined,
  };
}

export async function getAttendanceHistory(params?: {
  page?: number;
  limit?: number;
  driverId?: string;
}): Promise<{ rows: DriverCheckin[]; total: number; page: number; limit: number }> {
  const res = await api.get<AttendanceHistoryEnvelope>('/attendance/history', { params });
  return {
    rows: (res.data?.data || []).map(toUiCheckin),
    total: res.data?.total || 0,
    page: res.data?.page || params?.page || 1,
    limit: res.data?.limit || params?.limit || 10,
  };
}

export async function getAttendanceById(id: string): Promise<AttendanceEntity> {
  const res = await api.get<AttendanceEntity>(`/attendance/${id}`);
  return res.data;
}

export async function approveAttendance(input: { id: string; adminId: string; remarks?: string }): Promise<AttendanceEntity> {
  const res = await api.post<AttendanceEntity>(`/attendance/${input.id}/approve`, {
    adminId: input.adminId,
    remarks: input.remarks,
  });
  return res.data;
}

export async function rejectAttendance(input: { id: string; adminId: string; remarks?: string }): Promise<AttendanceEntity> {
  const res = await api.post<AttendanceEntity>(`/attendance/${input.id}/reject`, {
    adminId: input.adminId,
    remarks: input.remarks,
  });
  return res.data;
}

export function attendanceEntityToDriverCheckin(entity: AttendanceEntity): DriverCheckin {
  return toUiCheckin(entity);
}


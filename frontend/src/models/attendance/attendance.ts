export type AttendanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_OUT';

export type AttendanceEntity = {
  id: string;
  driverId: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: AttendanceStatus;
  approvedBy: string | null;
  adminRemarks: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  selfieUrl: string | null;
  odometerStart: number | null;
  odometerEnd: number | null;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    userId: string;
    fleetId: string;
    firstName: string;
    lastName: string;
    mobile: string;
    user?: {
      id: string;
      name: string;
      phone: string;
      role: string;
    };
    fleet?: {
      id: string;
      name: string;
      city: string;
    };
  };
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};


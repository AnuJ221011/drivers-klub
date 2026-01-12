import api from './axios';

import type {
  DriverPreferenceChangeRequest,
  DriverPreferenceChangeRequestStatus,
} from '../models/driver/driverPreferences';

/**
 * Get all pending driver preference change requests
 */
export async function getPendingDriverPreferenceRequests(): Promise<
  DriverPreferenceChangeRequest[]
> {
  const res = await api.get<DriverPreferenceChangeRequest[]>(
    '/drivers/preference/pending-requests',
  );

  return res.data;
}

/**
 * Update driver preference request status (Approve / Reject)
 */
export type UpdateDriverPreferenceRequestStatusInput =
  | {
      id: string;
      status: Extract<DriverPreferenceChangeRequestStatus, 'APPROVED'>;
    }
  | {
      id: string;
      status: Extract<DriverPreferenceChangeRequestStatus, 'REJECTED'>;
      rejection_reason: string;
    };

export async function updateDriverPreferenceRequestStatus(
  input: UpdateDriverPreferenceRequestStatusInput,
): Promise<DriverPreferenceChangeRequest> {
  const res = await api.post<DriverPreferenceChangeRequest>(
    '/drivers/preference/update-status',
    input,
  );

  return res.data;
}

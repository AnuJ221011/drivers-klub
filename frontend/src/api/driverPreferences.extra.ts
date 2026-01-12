import api from './axios';

import type {
  DriverPreference,
  DriverPreferenceChangeRequest,
  DriverPreferenceKey,
  } from '../models/driver/driverPreferences';
import { DEFAULT_DRIVER_PREFERENCE } from '../models/driver/driverPreferences';

/**
 * Get current driver preferences
 *
 * GET /drivers/{driverId}/preference
 */
export async function getDriverPreference(
  driverId: string,
): Promise<DriverPreference> {
  const res = await api.get(`/drivers/${driverId}/preference`);

  console.log('Fetched driver preferences:', res.data);

  // Backend returns an array of preference definitions; convert to map
  const prefsArray: Array<{ key: string; value: boolean } | null> = res.data || [];

  const out: DriverPreference = { ...DEFAULT_DRIVER_PREFERENCE };

  for (const p of prefsArray) {
    if (!p || typeof p.key !== 'string') continue;
    const key = p.key as DriverPreferenceKey;
    // Only set known keys
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      out[key] = Boolean(p.value);
    }
  }

  console.log('Fetched driver preferences (mapped):', out);

  return out;
}

/**
 * Create a pending driver preference change request
 *
 * POST /drivers/{driverId}/preference/update
 */
export async function createDriverPreferenceChangeRequest(input: {
  driverId: string;
  key: DriverPreferenceKey;
  value: boolean;
}): Promise<DriverPreferenceChangeRequest> {
  const res = await api.post<DriverPreferenceChangeRequest>(
    `/drivers/${input.driverId}/preference/update`,
    {
      [input.key]: input.value, // <-- backend expects flat object
    },
  );

  return res.data;
}


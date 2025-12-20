/**
 * Central place for temporary defaults (until Fleet selection UI is added).
 *
 * Recommended: set via `.env`:
 * - VITE_DEFAULT_FLEET_ID="your-fleet-id"
 * - VITE_DEFAULT_MANAGER_ID="your-manager-id"
 */

export const DEFAULT_FLEET_ID: string = (import.meta.env.VITE_DEFAULT_FLEET_ID as string | undefined) || "";
export const DEFAULT_MANAGER_ID: string = (import.meta.env.VITE_DEFAULT_MANAGER_ID as string | undefined) || "";

export function getDefaultFleetId(): string | null {
  const v = (DEFAULT_FLEET_ID || "").trim();
  return v ? v : null;
}

export function getDefaultManagerId(): string | null {
  const v = (DEFAULT_MANAGER_ID || "").trim();
  return v ? v : null;
}
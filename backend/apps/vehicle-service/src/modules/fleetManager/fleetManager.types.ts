/**
 * Fleet Managers are stored in the `User` table (role = MANAGER, scoped by fleetId).
 *
 * This file defines the API shape expected by the admin frontend (kept compatible
 * with the previous FleetManager table responses).
 */
export type CreateFleetManagerInput = {
  name: string;
  mobile: string; // maps to User.phone
  city: string; // kept for compatibility (derived from Fleet.city in responses)
  profilePicture?: string; // kept for compatibility (not stored on User)
  fleetId: string;
};

export type FleetManagerStatus = "ACTIVE" | "INACTIVE";

export type FleetManagerRole = "MANAGER" | "FLEET_ADMIN";

export type FleetManagerEntity = {
  id: string;
  name: string;
  mobile: string;
  city: string;
  profilePicture?: string | null;
  fleetId: string;
  role: FleetManagerRole;
  status: FleetManagerStatus;
  createdAt: Date;
  updatedAt: Date;
};

import type { UserRole } from './user';

export type TeamStatus = 'Active' | 'Inactive';

export type TeamMember = {
  id: string;
  shortId?: string | null;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  /** Fleet ID for FLEET_ADMIN, MANAGER, OPERATIONS roles */
  fleetId?: string | null;
  /** Readable hub labels for table display (Operations/Managers can have multiple hubs) */
  hubLabels?: string[];
  /** Assigned hub ids (derived from hubs where hubManagerId === user.id) */
  hubIds?: string[];
  status: TeamStatus;
};
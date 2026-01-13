import type { User, UserRole } from "@prisma/client";

export type CreateUserInput = {
  name: string;
  phone: string;
  role: UserRole;
  isActive?: boolean;
  /**
   * Role-scoped access control assignments:
   * - FLEET_ADMIN / MANAGER: fleets they can manage
   * - OPERATIONS: hubs they can operate
   */
  fleetIds?: string[];
  hubIds?: string[];
};

export type UpdateUserInput = {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  fleetIds?: string[];
  hubIds?: string[];
};

export type UserEntity = User & {
  fleetAccess?: { fleetId: string }[];
  hubAccess?: { hubId: string }[];
};

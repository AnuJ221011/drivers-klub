import type { User, UserRole } from "@prisma/client";

export type CreateUserInput = {
  name: string;
  phone: string;
  role: UserRole;
  isActive?: boolean;
  /**
   * Role-scoped access control assignments:
   * - FLEET_ADMIN / MANAGER / OPERATIONS: fleetId scope
   * - OPERATIONS: hubIds scope (non-empty)
   */
  fleetId?: string | null;
  hubIds?: string[];
};

export type UpdateUserInput = {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  fleetId?: string | null;
  hubIds?: string[];
};

export type UserEntity = User;

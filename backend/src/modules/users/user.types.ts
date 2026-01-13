import type { User, UserRole } from "@prisma/client";

export type CreateUserInput = {
    name: string;
    phone: string;
    role: UserRole;
    fleetId?: string;
    hubIds?: string[];
    isActive?: boolean;
};

export type UpdateUserInput = {
    name?: string;
    role?: UserRole;
    isActive?: boolean;
};

export type UserEntity = User;

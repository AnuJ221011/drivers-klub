import { UserRepository } from "./user.repository.js";
import type { CreateUserInput, UserEntity } from "./user.types.js";
import { ApiError } from "@driversklub/common";
import { prisma } from "@driversklub/database";
import type { UserRole } from "@prisma/client";

export class UserService {
    private userRepo: UserRepository;

    constructor(userRepo = new UserRepository()) {
        this.userRepo = userRepo;
    }

    private async validateRoleAssignmentsForCreate(role: UserRole, fleetIds?: string[], hubIds?: string[]) {
        const uniqueFleetIds = Array.from(new Set((fleetIds || []).filter(Boolean)));
        const uniqueHubIds = Array.from(new Set((hubIds || []).filter(Boolean)));

        if (role === "FLEET_ADMIN" || role === "MANAGER") {
            if (uniqueFleetIds.length === 0) {
                throw new ApiError(400, "fleetIds is required for Fleet Admin / Manager");
            }
            // Ensure fleets exist
            const count = await prisma.fleet.count({ where: { id: { in: uniqueFleetIds } } });
            if (count !== uniqueFleetIds.length) {
                throw new ApiError(400, "One or more fleetIds are invalid");
            }
        }

        if (role === "OPERATIONS") {
            if (uniqueHubIds.length === 0) {
                throw new ApiError(400, "hubIds is required for Operations");
            }
            const count = await prisma.fleetHub.count({ where: { id: { in: uniqueHubIds } } });
            if (count !== uniqueHubIds.length) {
                throw new ApiError(400, "One or more hubIds are invalid");
            }
        }
    }

    private async validateRoleAssignmentsForUpdate(
        role: UserRole,
        prevRole: UserRole,
        fleetIds?: string[],
        hubIds?: string[]
    ) {
        const uniqueFleetIds =
            fleetIds === undefined ? undefined : Array.from(new Set((fleetIds || []).filter(Boolean)));
        const uniqueHubIds =
            hubIds === undefined ? undefined : Array.from(new Set((hubIds || []).filter(Boolean)));

        const roleChanged = role !== prevRole;

        if (role === "FLEET_ADMIN" || role === "MANAGER") {
            // If role is being changed into a fleet-scoped role, require fleetIds in the same request.
            if (roleChanged && (prevRole !== "FLEET_ADMIN" && prevRole !== "MANAGER")) {
                if (!uniqueFleetIds || uniqueFleetIds.length === 0) {
                    throw new ApiError(400, "fleetIds is required when changing role to Fleet Admin / Manager");
                }
            }
            // If fleetIds were provided, validate them (and allow empty to clear).
            if (uniqueFleetIds && uniqueFleetIds.length > 0) {
                const count = await prisma.fleet.count({ where: { id: { in: uniqueFleetIds } } });
                if (count !== uniqueFleetIds.length) {
                    throw new ApiError(400, "One or more fleetIds are invalid");
                }
            }
        }

        if (role === "OPERATIONS") {
            if (roleChanged && prevRole !== "OPERATIONS") {
                if (!uniqueHubIds || uniqueHubIds.length === 0) {
                    throw new ApiError(400, "hubIds is required when changing role to Operations");
                }
            }
            if (uniqueHubIds && uniqueHubIds.length > 0) {
                const count = await prisma.fleetHub.count({ where: { id: { in: uniqueHubIds } } });
                if (count !== uniqueHubIds.length) {
                    throw new ApiError(400, "One or more hubIds are invalid");
                }
            }
        }
    }

    async createUser(data: CreateUserInput): Promise<UserEntity> {
        if (!data?.phone) {
            throw new ApiError(400, "Invalid user data");
        }

        const existingUser = await this.userRepo.findByPhone(data.phone);

        if (existingUser) {
            throw new ApiError(409, "User with this phone number already exists");
        }

        await this.validateRoleAssignmentsForCreate(data.role, data.fleetIds, data.hubIds);
        return this.userRepo.create(data);
    }

    async updateUser(
        actorRole: UserRole,
        userId: string,
        data: {
            name?: string;
            role?: UserRole;
            isActive?: boolean;
            fleetIds?: string[];
            hubIds?: string[];
        }
    ): Promise<UserEntity> {
        const existing = await this.userRepo.findById(userId);
        if (!existing) {
            throw new ApiError(404, "User not found");
        }

        // Managers must never be able to create/change Fleet Admins
        if (actorRole === "MANAGER") {
            if (existing.role === "FLEET_ADMIN" || data.role === "FLEET_ADMIN") {
                throw new ApiError(403, "Managers cannot create or modify Fleet Admin users");
            }
        }

        const effectiveRole = data.role ?? existing.role;
        await this.validateRoleAssignmentsForUpdate(
            effectiveRole,
            existing.role,
            data.fleetIds,
            data.hubIds
        );

        return this.userRepo.update(userId, data);
    }


    async getUserById(id: string): Promise<UserEntity> {
        const user = await this.userRepo.findById(id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (!user.isActive) {
            throw new ApiError(403, "User is deactivated");
        }

        return user;
    }

    async deactivateUser(id: string): Promise<UserEntity> {
        const user = await this.userRepo.findById(id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        return this.userRepo.deactivate(id);
    }
}

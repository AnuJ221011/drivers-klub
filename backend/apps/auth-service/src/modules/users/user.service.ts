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

    private async assertValidScopeForRole(role: UserRole, fleetId?: string | null, hubIds?: string[]) {
        const cleanedHubIds = Array.from(new Set((hubIds || []).filter(Boolean)));

        if (role === "FLEET_ADMIN" || role === "MANAGER") {
            if (!fleetId) throw new ApiError(400, "fleetId is required for Fleet Admin / Manager");
            const exists = await prisma.fleet.findUnique({ where: { id: fleetId } });
            if (!exists) throw new ApiError(400, "Invalid fleetId");
        }

        if (role === "OPERATIONS") {
            if (!fleetId) throw new ApiError(400, "fleetId is required for Operations");
            if (cleanedHubIds.length === 0) throw new ApiError(400, "hubIds is required for Operations");
            // Ensure hubs belong to the fleet
            const count = await prisma.fleetHub.count({
                where: { id: { in: cleanedHubIds }, fleetId }
            });
            if (count !== cleanedHubIds.length) {
                throw new ApiError(400, "One or more hubIds are invalid for the selected fleet");
            }
        }

        // SUPER_ADMIN / DRIVER: no scope requirements here
    }

    private assertCreatePermissions(actor: { role: UserRole; fleetId?: string | null }, targetRole: UserRole) {
        // MANAGER can only create OPERATIONS
        if (actor.role === "MANAGER" && targetRole !== "OPERATIONS") {
            throw new ApiError(403, "Manager can only create Operations users");
        }

        // FLEET_ADMIN cannot create SUPER_ADMIN or another FLEET_ADMIN
        if (actor.role === "FLEET_ADMIN" && (targetRole === "SUPER_ADMIN" || targetRole === "FLEET_ADMIN")) {
            throw new ApiError(403, "Fleet Admin cannot create Admin or Fleet Admin users");
        }
    }

    private assertFleetScope(actor: { role: UserRole; fleetId?: string | null }, fleetId?: string | null) {
        if (actor.role === "SUPER_ADMIN") return;
        // Non-super actors cannot assign users to a different fleet than their own
        const actorFleetId = actor.fleetId ?? null;
        if (!actorFleetId) {
            throw new ApiError(403, "Your account is not scoped to any fleet");
        }
        if (fleetId !== actorFleetId) {
            throw new ApiError(403, "You cannot assign users to a different fleet");
        }
    }

    async createUser(
        actor: { role: UserRole; fleetId?: string | null },
        data: CreateUserInput
    ): Promise<UserEntity> {
        if (!data?.phone) throw new ApiError(400, "Invalid user data");

        const existingUser = await this.userRepo.findByPhone(data.phone);
        if (existingUser) throw new ApiError(409, "User with this phone number already exists");

        this.assertCreatePermissions(actor, data.role);
        this.assertFleetScope(actor, data.fleetId ?? null);
        await this.assertValidScopeForRole(data.role, data.fleetId ?? null, data.hubIds);

        return this.userRepo.create({
            ...data,
            hubIds: Array.from(new Set((data.hubIds || []).filter(Boolean)))
        });
    }

    async updateUser(
        actor: { role: UserRole; fleetId?: string | null },
        userId: string,
        data: {
            name?: string;
            role?: UserRole;
            isActive?: boolean;
            fleetId?: string | null;
            hubIds?: string[];
        }
    ): Promise<UserEntity> {
        const existing = await this.userRepo.findById(userId);
        if (!existing) {
            throw new ApiError(404, "User not found");
        }

        // Managers cannot create/change fleet admins
        if (actor.role === "MANAGER") {
            if (existing.role === "FLEET_ADMIN" || data.role === "FLEET_ADMIN") {
                throw new ApiError(403, "Manager cannot create or modify Fleet Admin users");
            }
        }

        const effectiveRole = data.role ?? existing.role;
        const effectiveFleetId = data.fleetId !== undefined ? data.fleetId : existing.fleetId;

        this.assertFleetScope(actor, effectiveFleetId ?? null);
        await this.assertValidScopeForRole(effectiveRole, effectiveFleetId ?? null, data.hubIds ?? existing.hubIds);

        return this.userRepo.update(userId, {
            ...data,
            hubIds: data.hubIds ? Array.from(new Set(data.hubIds.filter(Boolean))) : undefined
        });
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

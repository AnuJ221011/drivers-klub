import { UserRepository } from "./user.repository.js";
import type { CreateUserInput, UserEntity } from "./user.types.js";
import { ApiError } from "../../utils/apiError.js";
import type { UserRole } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";

export class UserService {
    private userRepo: UserRepository;

    constructor(userRepo = new UserRepository()) {
        this.userRepo = userRepo;
    }

    async createUser(data: CreateUserInput, actor?: { id: string; role: UserRole; fleetId?: string; hubIds?: string[] }): Promise<UserEntity> {
        if (!data?.phone) {
            throw new ApiError(400, "Invalid user data");
        }

        // Permission rules:
        // - SUPER_ADMIN can create any admin roles
        // - FLEET_ADMIN can create MANAGER/OPERATIONS for their fleet
        // - MANAGER can create OPERATIONS for their fleet (but cannot create/update FLEET_ADMIN)
        if (actor?.role === "MANAGER" && data.role === "FLEET_ADMIN") {
            throw new ApiError(403, "MANAGER cannot create Fleet Admin");
        }
        if (actor?.role === "FLEET_ADMIN" && (data.role === "FLEET_ADMIN" || data.role === "SUPER_ADMIN")) {
            throw new ApiError(403, "FLEET_ADMIN cannot create this role");
        }
        if (actor?.role === "MANAGER" && data.role !== "OPERATIONS") {
            throw new ApiError(403, "MANAGER can only create OPERATIONS users");
        }

        // Scope validation:
        // - FLEET_ADMIN/MANAGER must have fleetId
        // - OPERATIONS must have fleetId + hubIds (non-empty), and hubs must belong to fleetId
        const role = data.role as UserRole;
        const fleetId = data.fleetId ? String(data.fleetId) : undefined;
        const hubIds = Array.isArray(data.hubIds) ? data.hubIds.map(String) : [];

        if (role === "FLEET_ADMIN" || role === "MANAGER") {
            if (!fleetId) throw new ApiError(400, "fleetId is required for this role");
            const fleet = await prisma.fleet.findUnique({ where: { id: fleetId }, select: { id: true } });
            if (!fleet) throw new ApiError(404, "Fleet not found");

            // If actor is scoped, enforce same fleet
            if (actor?.role !== "SUPER_ADMIN") {
                if (!actor?.fleetId) throw new ApiError(403, "Actor is not scoped to a fleet");
                if (actor.fleetId !== fleetId) throw new ApiError(403, "Cannot assign user to another fleet");
            }
        }

        if (role === "OPERATIONS") {
            if (!fleetId) throw new ApiError(400, "fleetId is required for OPERATIONS");
            if (hubIds.length === 0) throw new ApiError(400, "hubIds is required for OPERATIONS");

            const [fleet, hubs] = await Promise.all([
                prisma.fleet.findUnique({ where: { id: fleetId }, select: { id: true } }),
                prisma.fleetHub.findMany({ where: { id: { in: hubIds } }, select: { id: true, fleetId: true } }),
            ]);
            if (!fleet) throw new ApiError(404, "Fleet not found");
            if (hubs.length !== hubIds.length) throw new ApiError(400, "One or more hubIds are invalid");
            const wrong = hubs.find((h) => h.fleetId !== fleetId);
            if (wrong) throw new ApiError(400, "One or more hubs do not belong to selected fleet");

            if (actor?.role !== "SUPER_ADMIN") {
                if (!actor?.fleetId) throw new ApiError(403, "Actor is not scoped to a fleet");
                if (actor.fleetId !== fleetId) throw new ApiError(403, "Cannot assign user to another fleet");
                // Optional: if actor is OPERATIONS, they can only assign hubs that they own
                if (actor.role === "OPERATIONS") {
                    const allowed = new Set(actor.hubIds || []);
                    if (hubIds.some((h) => !allowed.has(h))) {
                        throw new ApiError(403, "Cannot assign operations user to hubs outside your scope");
                    }
                }
            }
        }

        const existingUser = await this.userRepo.findByPhone(data.phone);

        if (existingUser) {
            throw new ApiError(409, "User with this phone number already exists");
        }

        return this.userRepo.create({
            name: data.name,
            phone: data.phone,
            role: data.role,
            fleetId: fleetId,
            hubIds,
            isActive: typeof data.isActive === "boolean" ? data.isActive : undefined,
        } as any);
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

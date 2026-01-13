import { prisma } from "@driversklub/database";
import type {
    CreateUserInput,
    UpdateUserInput,
    UserEntity
} from "./user.types.js";

export class UserRepository {
    async create(data: CreateUserInput): Promise<UserEntity> {
        const fleetIds = Array.from(new Set((data.fleetIds || []).filter(Boolean)));
        const hubIds = Array.from(new Set((data.hubIds || []).filter(Boolean)));

        return prisma.user.create({
            data: {
                name: data.name,
                phone: data.phone,
                role: data.role,
                isActive: data.isActive ?? true,
                fleetAccess: fleetIds.length
                    ? {
                        createMany: {
                            data: fleetIds.map((fleetId) => ({ fleetId }))
                        }
                    }
                    : undefined,
                hubAccess: hubIds.length
                    ? {
                        createMany: {
                            data: hubIds.map((hubId) => ({ hubId }))
                        }
                    }
                    : undefined
            },
            include: {
                fleetAccess: { select: { fleetId: true } },
                hubAccess: { select: { hubId: true } }
            }
        });
    }

    async findById(id: string): Promise<UserEntity | null> {
        return prisma.user.findUnique({
            where: { id },
            include: {
                fleetAccess: { select: { fleetId: true } },
                hubAccess: { select: { hubId: true } }
            }
        });
    }

    async findByPhone(phone: string): Promise<UserEntity | null> {
        return prisma.user.findUnique({
            where: { phone },
            include: {
                fleetAccess: { select: { fleetId: true } },
                hubAccess: { select: { hubId: true } }
            }
        });
    }

    async findAll(): Promise<UserEntity[]> {
        return prisma.user.findMany({
            include: {
                fleetAccess: { select: { fleetId: true } },
                hubAccess: { select: { hubId: true } }
            }
        });
    }

    async update(
        id: string,
        data: UpdateUserInput
    ): Promise<UserEntity> {
        const fleetIds =
            data.fleetIds === undefined
                ? undefined
                : Array.from(new Set((data.fleetIds || []).filter(Boolean)));
        const hubIds =
            data.hubIds === undefined
                ? undefined
                : Array.from(new Set((data.hubIds || []).filter(Boolean)));

        return prisma.user.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.role !== undefined ? { role: data.role } : {}),
                ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                ...(fleetIds !== undefined
                    ? {
                        fleetAccess: {
                            deleteMany: {},
                            ...(fleetIds.length
                                ? {
                                    createMany: {
                                        data: fleetIds.map((fleetId) => ({ fleetId }))
                                    }
                                }
                                : {})
                        }
                    }
                    : {}),
                ...(hubIds !== undefined
                    ? {
                        hubAccess: {
                            deleteMany: {},
                            ...(hubIds.length
                                ? {
                                    createMany: {
                                        data: hubIds.map((hubId) => ({ hubId }))
                                    }
                                }
                                : {})
                        }
                    }
                    : {})
            },
            include: {
                fleetAccess: { select: { fleetId: true } },
                hubAccess: { select: { hubId: true } }
            }
        });
    }

    async deactivate(id: string): Promise<UserEntity> {
        return prisma.user.update({
            where: { id },
            data: { isActive: false }
        });
    }
}

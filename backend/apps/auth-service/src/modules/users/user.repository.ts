import { prisma } from "@driversklub/database";
import type {
    CreateUserInput,
    UpdateUserInput,
    UserEntity
} from "./user.types.js";

export class UserRepository {
    async create(data: CreateUserInput): Promise<UserEntity> {
        const hubIds = Array.from(new Set((data.hubIds || []).filter(Boolean)));

        return prisma.user.create({
            data: {
                name: data.name,
                phone: data.phone,
                role: data.role,
                isActive: data.isActive ?? true,
                fleetId: data.fleetId ?? null,
                hubIds
            }
        });
    }

    async findById(id: string): Promise<UserEntity | null> {
        return prisma.user.findUnique({ where: { id } });
    }

    async findByPhone(phone: string): Promise<UserEntity | null> {
        return prisma.user.findUnique({ where: { phone } });
    }

    async findAll(): Promise<UserEntity[]> {
        return prisma.user.findMany();
    }

    async update(
        id: string,
        data: UpdateUserInput
    ): Promise<UserEntity> {
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
                ...(data.fleetId !== undefined ? { fleetId: data.fleetId } : {}),
                ...(hubIds !== undefined ? { hubIds } : {})
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

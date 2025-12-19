import { prisma } from "../../utils/prisma.js";
import type {
    CreateUserInput,
    UpdateUserInput,
    UserEntity
} from "./user.types.js";

export class UserRepository {
    async create(data: CreateUserInput): Promise<UserEntity> {
        return prisma.user.create({ data });
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
        return prisma.user.update({
            where: { id },
            data
        });
    }

    async deactivate(id: string): Promise<UserEntity> {
        return prisma.user.update({
            where: { id },
            data: { isActive: false }
        });
    }
}

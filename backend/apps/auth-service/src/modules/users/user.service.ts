import { UserRepository } from "./user.repository.js";
import type { CreateUserInput, UserEntity } from "./user.types.js";
import { ApiError } from "@driversklub/common";

export class UserService {
    private userRepo: UserRepository;

    constructor(userRepo = new UserRepository()) {
        this.userRepo = userRepo;
    }

    async createUser(data: CreateUserInput): Promise<UserEntity> {
        if (!data?.phone) {
            throw new ApiError(400, "Invalid user data");
        }

        const existingUser = await this.userRepo.findByPhone(data.phone);

        if (existingUser) {
            throw new ApiError(409, "User with this phone number already exists");
        }

        return this.userRepo.create(data);
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

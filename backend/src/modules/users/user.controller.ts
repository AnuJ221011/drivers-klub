import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

const userService = new UserService();

export const createUser = async (req: Request, res: Response) => {
    const { name, phone, role } = req.body;

    if (!name || !phone || !role) {
        throw new ApiError(400, "name, phone and role are required");
    }

    const user = await userService.createUser({ name, phone, role });
    ApiResponse.send(res, 201, user, "User created successfully");
};


export const getAllUsers = async (_req: Request, res: Response) => {
    const users = await userService["userRepo"].findAll();
    ApiResponse.send(res, 200, users, "Users retrieved successfully");
};

export const getUserById = async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    ApiResponse.send(res, 200, user, "User retrieved successfully");
};

export const deactivateUser = async (req: Request, res: Response) => {
    const user = await userService.deactivateUser(req.params.id);
    ApiResponse.send(res, 200, user, "User deactivated successfully");
};


// note
// Accessing userRepo directly here is temporary.
// We’ll clean this in Phase 4 with service methods.
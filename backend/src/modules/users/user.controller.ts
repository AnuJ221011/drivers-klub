import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { ApiError } from "../../utils/apiError.js";

const userService = new UserService();

export const createUser = async (req: Request, res: Response) => {
    const { name, phone, role } = req.body;

    if (!name || !phone || !role) {
        throw new ApiError(400, "name, phone and role are required");
    }

    const user = await userService.createUser({ name, phone, role });
    res.status(201).json(user);
};


export const getAllUsers = async (_req: Request, res: Response) => {
    const users = await userService["userRepo"].findAll();
    res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
};

export const deactivateUser = async (req: Request, res: Response) => {
    const user = await userService.deactivateUser(req.params.id);
    res.json(user);
};


// note
// Accessing userRepo directly here is temporary.
// We’ll clean this in Phase 4 with service methods.
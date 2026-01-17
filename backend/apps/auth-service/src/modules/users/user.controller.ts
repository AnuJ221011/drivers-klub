import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { ApiResponse, ApiError } from "@driversklub/common";
import type { UserRole } from "@prisma/client";

const userService = new UserService();

export const createUser = async (req: Request, res: Response) => {
  const { name, phone, role, fleetId, hubIds, isActive } = req.body as {
    name?: string;
    phone?: string;
    role?: UserRole;
    fleetId?: string | null;
    hubIds?: string[];
    isActive?: boolean;
  };

  if (!name || !phone || !role) {
    throw new ApiError(400, "name, phone and role are required");
  }

  const actor = req.user;
  if (!actor?.role) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await userService.createUser(actor, { name, phone, role, fleetId, hubIds, isActive });
  ApiResponse.send(res, 201, user, "User created successfully");
};

export const updateUser = async (req: Request, res: Response) => {
  const { name, role, fleetId, hubIds, isActive } = (req.body ?? {}) as {
    name?: string;
    role?: UserRole;
    fleetId?: string | null;
    hubIds?: string[];
    isActive?: boolean;
  };

  const actor = req.user;
  if (!actor?.role) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await userService.updateUser(actor, req.params.id, {
    name,
    role,
    fleetId,
    hubIds,
    isActive,
  });

  ApiResponse.send(res, 200, user, "User updated successfully");
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
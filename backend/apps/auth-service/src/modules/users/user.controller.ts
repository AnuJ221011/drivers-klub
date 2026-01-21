import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { ApiResponse, ApiError } from "@driversklub/common";
import { UserRole } from "@prisma/client";
import { prisma } from "@driversklub/database";
import { OtpService } from "../auth/otp/otp.service.js";

const userService = new UserService();
const otpService = new OtpService();

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

  if (!req.user) {
    throw new ApiError(401, "User context required");
  }

  const user = await userService.createUser(req.user, { name, phone, role, fleetId, hubIds, isActive });
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

  if (!req.user?.role) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await userService.updateUser(req.user, req.params.id, {
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

export const createUserAsDriver = async (req: Request, res: Response) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    throw new ApiError(400, "name and phone are required");
  }

  const driver = await userService.createPublicUser({
    name,
    phone,
    role: UserRole.DRIVER,
  });
  ApiResponse.send(res, 201, driver, "user created successfully");
};

export const verifyDriver = async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "phone number is required");
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    return res.status(404).json({ message: "User already registered" });
  }

  await otpService.sendOtp(phone);

  ApiResponse.send(
    res,
    200,
    { message: "OTP sent successfully" },
    "OTP sent successfully"
  );
};

export const verifyDriverOtp = async (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== "object") {
    console.warn("Invalid request body for verify-otp", body);
    return res.status(400).json({ message: "Invalid request body" });
  }

  const { phone, otp } = body as {
    phone?: string;
    otp?: string;
  };

  if (!phone || !otp) {
    console.warn("Missing phone or otp in verify-otp request", {
      phone,
      otp,
    });
    return res.status(400).json({ message: "phone and otp are required" });
  }

  await otpService.verifyOtp(phone, otp);

  ApiResponse.send(
    res,
    200,
    { message: "OTP verified successfully" },
    "OTP verified successfully"
  );
};

// note
// Accessing userRepo directly here is temporary.
// We’ll clean this in Phase 4 with service methods.
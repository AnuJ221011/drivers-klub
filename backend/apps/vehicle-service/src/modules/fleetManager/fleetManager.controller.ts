import type { Request, Response } from "express";
import { FleetManagerService } from "./fleetManager.service.js";
import { ApiResponse, ApiError } from "@driversklub/common";

const service = new FleetManagerService();

export const createFleetManager = async (req: Request, res: Response) => {
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (req.body?.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
  }
  const manager = await service.createFleetManager(req.body);
  ApiResponse.send(res, 201, manager, "Fleet Manager created successfully");
};

export const getFleetManagersByFleet = async (req: Request, res: Response) => {
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (req.params.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
  }
  const managers = await service.getFleetManagersByFleet(req.params.fleetId);
  ApiResponse.send(res, 200, managers, "Fleet Managers retrieved successfully");
};

export const deactivateFleetManager = async (req: Request, res: Response) => {
  const role = String(req.user?.role || "");
  const managerRow = await service.getFleetManagerById(req.params.id);
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (managerRow.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
  }
  const manager = await service.deactivateFleetManager(req.params.id);
  ApiResponse.send(res, 200, manager, "Fleet Manager deactivated successfully");
};

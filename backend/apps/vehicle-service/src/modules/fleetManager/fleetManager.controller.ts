import type { Request, Response } from "express";
import { FleetManagerService } from "./fleetManager.service.js";
import { ApiResponse, ApiError } from "@driversklub/common";

const service = new FleetManagerService();

// Use function declarations (not const) to avoid TDZ issues in some CJS/tsx runtimes.
export async function createFleetManager(req: Request, res: Response) {
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (req.body?.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
  }
  const manager = await service.createFleetManager(req.body);
  ApiResponse.send(res, 201, manager, "Fleet Manager created successfully");
}

export async function getFleetManagersByFleet(req: Request, res: Response) {
  const { fleetId } = req.params as { fleetId: string };
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
  }
  const managers = await service.getFleetManagersByFleet(fleetId);
  ApiResponse.send(res, 200, managers, "Fleet Managers retrieved successfully");
}

export async function deactivateFleetManager(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const role = String(req.user?.role || "");
  const managerRow = await service.getFleetManagerById(id);
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (managerRow.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
  }
  const manager = await service.deactivateFleetManager(id);
  ApiResponse.send(res, 200, manager, "Fleet Manager deactivated successfully");
}
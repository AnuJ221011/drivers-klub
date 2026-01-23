import type { Request, Response } from "express";
import { FleetManagerService } from "./fleetManager.service.js";
import { ApiResponse, ApiError } from "@driversklub/common";

const service = new FleetManagerService();
const getParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

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
  const fleetId = getParam(req.params.fleetId);
  if (!fleetId) throw new ApiError(400, "fleetId is required");
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
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "id is required");
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

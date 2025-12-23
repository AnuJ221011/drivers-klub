import type { Request, Response } from "express";
import { FleetManagerService } from "./fleetManager.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

const service = new FleetManagerService();

export const createFleetManager = async (req: Request, res: Response) => {
  const manager = await service.createFleetManager(req.body);
  ApiResponse.send(res, 201, manager, "Fleet Manager created successfully");
};

export const getFleetManagersByFleet = async (req: Request, res: Response) => {
  const managers = await service.getFleetManagersByFleet(req.params.fleetId);
  ApiResponse.send(res, 200, managers, "Fleet Managers retrieved successfully");
};

export const deactivateFleetManager = async (req: Request, res: Response) => {
  const manager = await service.deactivateFleetManager(req.params.id);
  ApiResponse.send(res, 200, manager, "Fleet Manager deactivated successfully");
};

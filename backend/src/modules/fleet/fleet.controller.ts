import type { Request, Response } from "express";
import { FleetService } from "./fleet.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

const fleetService = new FleetService();

export const createFleet = async (req: Request, res: Response) => {
  const fleet = await fleetService.createFleet(req.body);
  ApiResponse.send(res, 201, fleet, "Fleet created successfully");
};

export const getAllFleets = async (_req: Request, res: Response) => {
  const fleets = await fleetService.getAllFleets();
  ApiResponse.send(res, 200, fleets, "Fleets retrieved successfully");
};

export const getFleetById = async (req: Request, res: Response) => {
  const fleet = await fleetService.getFleetById(req.params.id);
  ApiResponse.send(res, 200, fleet, "Fleet retrieved successfully");
};

export const deactivateFleet = async (req: Request, res: Response) => {
  const fleet = await fleetService.deactivateFleet(req.params.id);
  ApiResponse.send(res, 200, fleet, "Fleet deactivated successfully");
};

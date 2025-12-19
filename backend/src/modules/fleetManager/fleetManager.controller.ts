import type { Request, Response } from "express";
import { FleetManagerService } from "./fleetManager.service.js";

const service = new FleetManagerService();

export const createFleetManager = async (req: Request, res: Response) => {
  const manager = await service.createFleetManager(req.body);
  res.status(201).json(manager);
};

export const getFleetManagersByFleet = async (req: Request, res: Response) => {
  const managers = await service.getFleetManagersByFleet(req.params.fleetId);
  res.json(managers);
};

export const deactivateFleetManager = async (req: Request, res: Response) => {
  const manager = await service.deactivateFleetManager(req.params.id);
  res.json(manager);
};

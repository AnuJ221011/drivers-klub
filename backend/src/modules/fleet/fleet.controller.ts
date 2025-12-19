import type { Request, Response } from "express";
import { FleetService } from "./fleet.service.js";

const fleetService = new FleetService();

export const createFleet = async (req: Request, res: Response) => {
  const fleet = await fleetService.createFleet(req.body);
  res.status(201).json(fleet);
};

export const getAllFleets = async (_req: Request, res: Response) => {
  const fleets = await fleetService.getAllFleets();
  res.json(fleets);
};

export const getFleetById = async (req: Request, res: Response) => {
  const fleet = await fleetService.getFleetById(req.params.id);
  res.json(fleet);
};

export const deactivateFleet = async (req: Request, res: Response) => {
  const fleet = await fleetService.deactivateFleet(req.params.id);
  res.json(fleet);
};

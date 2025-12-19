import type { Request, Response } from "express";
import { VehicleService } from "./vehicle.service.js";

const service = new VehicleService();

export const createVehicle = async (req: Request, res: Response) => {
  const vehicle = await service.createVehicle(req.body);
  res.status(201).json(vehicle);
};

export const getVehiclesByFleet = async (req: Request, res: Response) => {
  const vehicles = await service.getVehiclesByFleet(req.params.fleetId);
  res.json(vehicles);
};

export const getVehicleById = async (req: Request, res: Response) => {
  const vehicle = await service.getVehicleById(req.params.id);
  res.json(vehicle);
};

export const updateVehicleDocs = async (req: Request, res: Response) => {
  const vehicle = await service.updateVehicleDocs(req.params.id, req.body);
  res.json(vehicle);
};

export const deactivateVehicle = async (req: Request, res: Response) => {
  const vehicle = await service.deactivateVehicle(req.params.id);
  res.json(vehicle);
};

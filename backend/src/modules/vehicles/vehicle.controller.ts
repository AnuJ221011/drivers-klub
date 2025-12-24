import type { Request, Response } from "express";
import { VehicleService } from "./vehicle.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

const service = new VehicleService();

export const createVehicle = async (req: Request, res: Response) => {
  const vehicle = await service.createVehicle(req.body);
  ApiResponse.send(res, 201, vehicle, "Vehicle created successfully");
};

export const getVehiclesByFleet = async (req: Request, res: Response) => {
  const vehicles = await service.getVehiclesByFleet(req.params.fleetId);
  ApiResponse.send(res, 200, vehicles, "Vehicles retrieved successfully");
};

export const getVehicleById = async (req: Request, res: Response) => {
  const vehicle = await service.getVehicleById(req.params.id);
  ApiResponse.send(res, 200, vehicle, "Vehicle retrieved successfully");
};

export const updateVehicleDocs = async (req: Request, res: Response) => {
  const vehicle = await service.updateVehicleDocs(req.params.id, req.body);
  ApiResponse.send(res, 200, vehicle, "Vehicle docs updated successfully");
};

export const deactivateVehicle = async (req: Request, res: Response) => {
  const vehicle = await service.deactivateVehicle(req.params.id);
  ApiResponse.send(res, 200, vehicle, "Vehicle deactivated successfully");
};

export const updateVehicle = async (req: Request, res: Response) => {
  const vehicle = await service.updateVehicle(req.params.id, req.body);
  ApiResponse.send(res, 200, vehicle, "Vehicle updated successfully");
};

export const updateVehicleStatus = async (req: Request, res: Response) => {
  const vehicle = await service.updateVehicleStatus(req.params.id, req.body);
  ApiResponse.send(res, 200, vehicle, "Vehicle status updated successfully");
};
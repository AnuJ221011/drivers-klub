import type { Request, Response } from "express";
import { VehicleService } from "./vehicle.service.js";
import { ApiResponse } from "@driversklub/common";

const service = new VehicleService();

export const createVehicle = async (req: Request, res: Response) => {
  const vehicle = await service.createVehicle(req.body, req.user);
  ApiResponse.send(res, 201, vehicle, "Vehicle created successfully");
};

export const getVehiclesByFleet = async (req: Request, res: Response) => {
  const { fleetId } = req.params as { fleetId: string };
  const vehicles = await service.getVehiclesByFleet(fleetId, req.user);
  ApiResponse.send(res, 200, vehicles, "Vehicles retrieved successfully");
};

export const getVehiclesByHub = async (req: Request, res: Response) => {
  const { hubId } = req.params as { hubId: string };
  const vehicles = await service.getVehiclesByHub(hubId, req.user);
  ApiResponse.send(res, 200, vehicles, "Vehicles retrieved successfully");
};

export const getVehicleById = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const vehicle = await service.getVehicleById(id, req.user);
  ApiResponse.send(res, 200, vehicle, "Vehicle retrieved successfully");
};

export const updateVehicleDocs = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const vehicle = await service.updateVehicleDocs(id, req.body, req.user);
  ApiResponse.send(res, 200, vehicle, "Vehicle docs updated successfully");
};

export const deactivateVehicle = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const vehicle = await service.deactivateVehicle(id, req.user);
  ApiResponse.send(res, 200, vehicle, "Vehicle deactivated successfully");
};

export const updateVehicle = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const vehicle = await service.updateVehicle(id, req.body, req.user);
  ApiResponse.send(res, 200, vehicle, "Vehicle updated successfully");
};

export const updateVehicleStatus = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const vehicle = await service.updateVehicleStatus(id, req.body, req.user);
  ApiResponse.send(res, 200, vehicle, "Vehicle status updated successfully");
};
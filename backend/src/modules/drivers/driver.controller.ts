import type { Request, Response } from "express";
import { DriverService } from "./driver.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

const driverService = new DriverService();

export const createDriver = async (req: Request, res: Response) => {
  const driver = await driverService.createDriver(req.body);
  ApiResponse.send(res, 201, driver, "Driver created successfully");
};

export const getDriversByFleet = async (req: Request, res: Response) => {
  const drivers = await driverService.getDriversByFleet(req.params.fleetId);
  ApiResponse.send(res, 200, drivers, "Drivers retrieved successfully");
};

export const getDriverById = async (req: Request, res: Response) => {
  const driver = await driverService.getDriverById(req.params.id);
  ApiResponse.send(res, 200, driver, "Driver retrieved successfully");
};

export const updateDriver = async (req: Request, res: Response) => {
  const driver = await driverService.updateDriver(req.params.id, req.body);
  ApiResponse.send(res, 200, driver, "Driver updated successfully");
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  const driver = await driverService.updateDriverStatus(req.params.id, req.body);
  ApiResponse.send(res, 200, driver, "Driver status updated successfully");
};

export const updateDriverAvailability = async (req: Request, res: Response) => {
  const driver = await driverService.updateDriverAvailability(req.params.id, req.body);
  ApiResponse.send(res, 200, driver, "Driver availability updated successfully");
};

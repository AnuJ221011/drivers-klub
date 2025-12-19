import type { Request, Response } from "express";
import { DriverService } from "./driver.service.js";

const driverService = new DriverService();

export const createDriver = async (req: Request, res: Response) => {
  const driver = await driverService.createDriver(req.body);
  res.status(201).json(driver);
};

export const getDriversByFleet = async (req: Request, res: Response) => {
  const drivers = await driverService.getDriversByFleet(req.params.fleetId);
  res.json(drivers);
};

export const getDriverById = async (req: Request, res: Response) => {
  const driver = await driverService.getDriverById(req.params.id);
  res.json(driver);
};

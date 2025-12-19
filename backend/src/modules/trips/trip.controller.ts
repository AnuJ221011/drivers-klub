import type { Request, Response } from "express";
import { TripService } from "./trip.service.js";

const service = new TripService();

export const createTrip = async (req: Request, res: Response) => {
  const trip = await service.createTrip(req.body);
  res.status(201).json(trip);
};

export const startTrip = async (req: Request, res: Response) => {
  const trip = await service.startTrip(req.params.id, req.user.id);
  res.json(trip);
};

export const completeTrip = async (req: Request, res: Response) => {
  const trip = await service.completeTrip(
    req.params.id,
    req.user.id,
    req.body?.fare
  );
  res.json(trip);
};

export const getTripsByFleet = async (req: Request, res: Response) => {
  const trips = await service.getTripsByFleet(req.params.fleetId);
  res.json(trips);
};

export const getMyTrips = async (req: Request, res: Response) => {
  const driver = await (await import("../../utils/prisma.js")).prisma.driver.findUnique({
    where: { userId: req.user.id }
  });
  if (!driver) return res.json([]);
  const trips = await service.getTripsByDriver(driver.id);
  res.json(trips);
};

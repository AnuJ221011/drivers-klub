import type { Request, Response } from "express";
import { DriverService } from "./driver.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { prisma } from "../../utils/prisma.js";

const driverService = new DriverService();

export const createDriver = async (req: Request, res: Response) => {
  const driver = await driverService.createDriver(req.body);
  ApiResponse.send(res, 201, driver, "Driver created successfully");
};

export const getDriversByFleet = async (req: Request, res: Response) => {
  const drivers = await driverService.getDriversByFleet(req.params.fleetId);
  ApiResponse.send(res, 200, drivers, "Drivers retrieved successfully");
};

export const getDriversByHub = async (req: Request, res: Response) => {
  const drivers = await driverService.getDriversByHub(req.params.hubId);
  ApiResponse.send(res, 200, drivers, "Drivers retrieved successfully");
};

export const getDriverById = async (req: Request, res: Response) => {
  const driver = await driverService.getDriverById(req.params.id);
  ApiResponse.send(res, 200, driver, "Driver retrieved successfully");
};

export const getMyProfile = async (req: Request, res: Response) => {
  const { id: userId } = req.user as any;
  const driver = await prisma.driver.findFirst({ where: { userId } });

  if (!driver) {
    return res.status(404).json({ message: "Driver profile not found" });
  }

  ApiResponse.send(res, 200, driver, "My profile retrieved successfully");
};

export const updateDriver = async (req: Request, res: Response) => {
  const driver = await driverService.updateDriver(req.params.id, req.body);
  ApiResponse.send(res, 200, driver, "Driver updated successfully");
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  const driver = await driverService.updateDriverStatus(
    req.params.id,
    req.body
  );
  ApiResponse.send(res, 200, driver, "Driver status updated successfully");
};

export const updateDriverAvailability = async (req: Request, res: Response) => {
  const driver = await driverService.updateDriverAvailability(
    req.params.id,
    req.body
  );
  ApiResponse.send(
    res,
    200,
    driver,
    "Driver availability updated successfully"
  );
};

export const getDriverPreferences = async (req: Request, res: Response) => {
  const driverPreference = await driverService.getDriverPreferences(
    req.params.id
  );
  ApiResponse.send(
    res,
    200,
    driverPreference,
    "Driver preferences retrieved successfully"
  );
};

export const createDriverPreferencesChangeRequest = async (
  req: Request,
  res: Response
) => {
  const driverPreferenceChangeRequest =
    await driverService.driverPreferencesChangeRequest(req.params.id, req.body);
  ApiResponse.send(
    res,
    200,
    driverPreferenceChangeRequest,
    "Driver preferences update request sent successfully"
  );
};

export const getAllPreferenceChangePendingRequests = async (
  _req: Request,
  res: Response
) => {
  const pendingPreferenceChangeRequests =
    await driverService.getPendingPreferenceChangeRequests();

  ApiResponse.send(
    res,
    200,
    pendingPreferenceChangeRequests,
    "Pending preference requests retrieved successfully"
  );
};

export const updatePreferenceChangeRequestStatus = async (
  req: Request,
  res: Response
) => {
  const reviewedBy = req.user?.id;
  const updatedPreferenceChangeRequest =
    await driverService.updatePendingPreferenceChangeRequest(
      req.body,
      reviewedBy
    );

  ApiResponse.send(
    res,
    200,
    updatedPreferenceChangeRequest,
    "Preference change request updated successfully"
  );
};

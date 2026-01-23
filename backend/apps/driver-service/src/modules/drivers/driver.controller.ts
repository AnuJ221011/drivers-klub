import type { Request, Response } from "express";
import { DriverService } from "./driver.service.js";
import { S3Service, ApiResponse } from "@driversklub/common";
import { prisma } from "@driversklub/database";

const driverService = new DriverService();
const getParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const getUploadUrl = async (req: Request, res: Response) => {
  const { folder, fileType } = req.query;

  if (!folder || !fileType) {
    return ApiResponse.send(res, 400, null, "folder and fileType are required");
  }

  try {
    const data = await S3Service.getPresignedUrl(
      folder as string,
      "image/" + (fileType as string)
    );
    ApiResponse.send(res, 200, data, "Upload URL generated successfully");
  } catch (error: any) {
    ApiResponse.send(res, 400, null, error.message);
  }
};

export const createDriver = async (req: Request, res: Response) => {
  const driver = await driverService.createDriver(req.body, req.user);
  ApiResponse.send(res, 201, driver, "Driver created successfully");
};

export const createNewDriver = async (req: Request, res: Response) => {
  const newDriver = await driverService.createNewDriver(req.body);
  ApiResponse.send(
    res,
    201,
    newDriver,
    "Documents Uploaded, KYC pending for verification"
  );
};

export const getDriversByFleet = async (req: Request, res: Response) => {
  const fleetId = getParam(req.params.fleetId);
  if (!fleetId) return res.status(400).json({ message: "fleetId is required" });
  const drivers = await driverService.getDriversByFleet(fleetId, req.user);
  ApiResponse.send(res, 200, drivers, "Drivers retrieved successfully");
};

export const getDriversByHub = async (req: Request, res: Response) => {
  const hubId = getParam(req.params.hubId);
  if (!hubId) return res.status(400).json({ message: "hubId is required" });
  const drivers = await driverService.getDriversByHub(hubId, req.user);
  ApiResponse.send(res, 200, drivers, "Drivers retrieved successfully");
};

export const getDriverById = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });
  const driver = await driverService.getDriverById(id, req.user);
  ApiResponse.send(res, 200, driver, "Driver retrieved successfully");
};

export const getMyProfile = async (req: Request, res: Response) => {
  const { id: userId } = req.user as any;
  const driver = await prisma.driver.findFirst({
    where: { userId },
    include: {
      fleet: true,
      assignments: {
        where: { status: "ACTIVE" },
        include: { vehicle: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!driver) {
    return res.status(404).json({ message: "Driver profile not found" });
  }

  ApiResponse.send(res, 200, driver, "My profile retrieved successfully");
};

export const updateDriver = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });
  const driver = await driverService.updateDriver(id, req.body, req.user);
  ApiResponse.send(res, 200, driver, "Driver updated successfully");
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });
  const driver = await driverService.updateDriverStatus(
    id,
    req.body,
    req.user
  );
  ApiResponse.send(res, 200, driver, "Driver status updated successfully");
};

export const updateDriverAvailability = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });
  const driver = await driverService.updateDriverAvailability(
    id,
    req.body,
    req.user
  );
  ApiResponse.send(
    res,
    200,
    driver,
    "Driver availability updated successfully"
  );
};

export const getDriverPreferences = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });
  const driverPreference = await driverService.getDriverPreferences(
    id,
    req.user
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
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });
  const driverPreferenceChangeRequest =
    await driverService.driverPreferencesChangeRequest(id, req.body);
  ApiResponse.send(
    res,
    200,
    driverPreferenceChangeRequest,
    "Driver preferences update request sent successfully"
  );
};

export const getAllPreferenceChangePendingRequests = async (
  req: Request,
  res: Response
) => {
  const pendingPreferenceChangeRequests =
    await driverService.getPendingPreferenceChangeRequests(req.user);

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

/**
 * Get driver's active rental plan
 * GET /drivers/:id/active-plan
 */
export const getActivePlan = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });

  const activePlan = await prisma.driverRental.findFirst({
    where: {
      driverId: id,
      isActive: true,
      expiryDate: { gte: new Date() }
    },
    include: {
      rentalPlan: true
    },
    orderBy: { startDate: 'desc' }
  });

  if (!activePlan) {
    return ApiResponse.send(res, 200, null, "No active plan found");
  }

  // Fetch active vehicle
  const activeAssignment = await prisma.assignment.findFirst({
    where: {
      driverId: id,
      status: 'ACTIVE',
      endTime: null
    },
    include: {
      vehicle: true
    }
  });

  ApiResponse.send(res, 200, {
    id: activePlan.id,
    planName: activePlan.rentalPlan.name,
    rentalAmount: activePlan.rentalPlan.rentalAmount,
    depositAmount: activePlan.rentalPlan.depositAmount,
    validityDays: activePlan.rentalPlan.validityDays,
    startDate: activePlan.startDate,
    expiryDate: activePlan.expiryDate,
    isActive: activePlan.isActive,
    daysRemaining: Math.max(0, Math.ceil((new Date(activePlan.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    vehicle: activeAssignment ? {
      number: activeAssignment.vehicle.vehicleNumber,
      model: activeAssignment.vehicle.vehicleModel
    } : null
  }, "Active plan retrieved successfully");
};

/**
 * Get driver's plan history
 * GET /drivers/:id/plan-history
 */
export const getPlanHistory = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) return res.status(400).json({ message: "id is required" });

  const planHistory = await prisma.driverRental.findMany({
    where: { driverId: id },
    include: {
      rentalPlan: true
    },
    orderBy: { startDate: 'desc' }
  });

  const formattedHistory = planHistory.map(rental => ({
    id: rental.id,
    planName: rental.rentalPlan.name,
    rentalAmount: rental.rentalPlan.rentalAmount,
    depositAmount: rental.rentalPlan.depositAmount,
    validityDays: rental.rentalPlan.validityDays,
    startDate: rental.startDate,
    expiryDate: rental.expiryDate,
    isActive: rental.isActive,
    status: rental.isActive && new Date(rental.expiryDate) > new Date()
      ? 'ACTIVE'
      : new Date(rental.expiryDate) <= new Date()
        ? 'EXPIRED'
        : 'INACTIVE'
  }));

  ApiResponse.send(res, 200, formattedHistory, "Plan history retrieved successfully");
};

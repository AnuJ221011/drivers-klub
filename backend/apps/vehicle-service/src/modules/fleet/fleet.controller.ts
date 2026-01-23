import type { Request, Response } from "express";
import {
  FleetHubService,
  FleetService,
  HubManagerService,
} from "./fleet.service.js";
import { ApiResponse, ApiError } from "@driversklub/common";

const fleetService = new FleetService();
const fleetHubService = new FleetHubService();
const hubManagerService = new HubManagerService();
const getParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const createFleet = async (req: Request, res: Response) => {
  const fleet = await fleetService.createFleet(req.body);
  ApiResponse.send(res, 201, fleet, "Fleet created successfully");
};

export const getAllFleets = async (_req: Request, res: Response) => {
  const role = String(_req.user?.role || "");
  if (role === "SUPER_ADMIN") {
    const fleets = await fleetService.getAllFleets();
    return ApiResponse.send(res, 200, fleets, "Fleets retrieved successfully");
  }

  const scopedFleetId = _req.user?.fleetId;
  if (!scopedFleetId) {
    throw new ApiError(403, "Fleet scope not set for this user");
  }
  const fleet = await fleetService.getFleetById(scopedFleetId);
  const fleets = fleet ? [fleet] : [];
  ApiResponse.send(res, 200, fleets, "Fleets retrieved successfully");
};

export const getFleetById = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Fleet id is required");
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (scopedFleetId !== id) throw new ApiError(403, "Access denied");
  }
  const fleet = await fleetService.getFleetById(id);
  ApiResponse.send(res, 200, fleet, "Fleet retrieved successfully");
};

export const deactivateFleet = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Fleet id is required");
  const fleet = await fleetService.deactivateFleet(id);
  ApiResponse.send(res, 200, fleet, "Fleet deactivated successfully");
};

export const createFleetHub = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Fleet id is required");
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (scopedFleetId !== id) throw new ApiError(403, "Access denied");
  }
  const fleetHub = await fleetHubService.createFleetHub(
    id,
    req.body
  );
  ApiResponse.send(res, 201, fleetHub, "Fleet Hub created successfully");
};

export const getAllFleetHubs = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Fleet id is required");
  const role = String(req.user?.role || "");
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (scopedFleetId !== id) throw new ApiError(403, "Access denied");
  }
  const hubs = await fleetHubService.getAllFleetHubs(id);
  const hubIds = Array.isArray(req.user?.hubIds) ? req.user.hubIds : [];
  const fleetHubs = role === "OPERATIONS" ? hubs.filter((h) => hubIds.includes(h.id)) : hubs;
  ApiResponse.send(res, 200, fleetHubs, "Fleet hubs retrieved successfully");
};

export const getFleetHubById = async (req: Request, res: Response) => {
  const role = String(req.user?.role || "");
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Hub id is required");
  const hub = await fleetHubService.getFleetHubById(id);
  if (role !== "SUPER_ADMIN") {
    const scopedFleetId = req.user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (hub.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(req.user?.hubIds) ? req.user.hubIds : [];
      if (!hubIds.includes(hub.id)) throw new ApiError(403, "Access denied");
    }
  }
  ApiResponse.send(res, 200, hub, "Fleet hub retrieved successfully");
};

export const assignHubManager = async (req: Request, res: Response) => {
  const hubId = getParam(req.params.hubId);
  if (!hubId) throw new ApiError(400, "Hub id is required");
  const assignedHubManager = await fleetHubService.assignManager(
    hubId,
    req.body
  );
  ApiResponse.send(
    res,
    200,
    assignedHubManager,
    "Hub manager assigned to hub successfully"
  );
};

export const createHubManager = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Fleet id is required");
  const hubManager = await hubManagerService.createHubManager(
    id,
    req.body
  );
  ApiResponse.send(res, 201, hubManager, "Hub Manager created successfully");
};

export const getAllHubManagers = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Fleet id is required");
  const hubManagers = await hubManagerService.getAllHubManagers(id);
  ApiResponse.send(
    res,
    200,
    hubManagers,
    "Fleet hub managers retrieved successfully"
  );
};

export const getHubManagerById = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Hub manager id is required");
  const hubManager = await hubManagerService.getHubManagerById(id);
  ApiResponse.send(
    res,
    200,
    hubManager,
    "Fleet Hub Manager retrieved successfully"
  );
};

export const addVehicleToHub = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Hub id is required");
  const vehicle = await fleetHubService.addVehicle(id, req.body);
  ApiResponse.send(res, 200, vehicle, "Vehicle added to hub successfully");
};

export const addDriverToHub = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Hub id is required");
  const driver = await fleetHubService.addDriver(id, req.body);
  ApiResponse.send(res, 200, driver, "Driver added to hub successfully");
};

export const removeVehicleFromHub = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Hub id is required");
  const vehicle = await fleetHubService.removeVehicle(id, req.body);
  ApiResponse.send(res, 200, vehicle, "Vehicle removed from hub successfully");
};

export const removeDriverFromHub = async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  if (!id) throw new ApiError(400, "Hub id is required");
  const driver = await fleetHubService.removeDriver(id, req.body);
  ApiResponse.send(res, 200, driver, "Driver removed from hub successfully");
};
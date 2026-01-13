import type { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { UserRole } from "@prisma/client";

function isSuperAdmin(role: UserRole) {
  return role === "SUPER_ADMIN";
}

function requireUser(req: Request) {
  if (!req.user) throw new ApiError(401, "Unauthorized");
  return req.user;
}

/**
 * Enforce that non-super-admin users can only operate within their own fleet.
 * Reads the fleet id from a route param (e.g. :fleetId or :id).
 */
export function enforceFleetScopeFromParam(paramName: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = requireUser(req);
    if (isSuperAdmin(user.role)) return next();

    const fleetId = req.params?.[paramName];
    if (!fleetId) throw new ApiError(400, `Missing param: ${paramName}`);
    if (!user.fleetId) throw new ApiError(403, "User is not scoped to a fleet");
    if (user.fleetId !== fleetId) throw new ApiError(403, "Access denied");
    return next();
  };
}

/**
 * Enforce that non-super-admin users can only create/update resources for their fleet.
 * Reads fleetId from request body.
 */
export function enforceFleetScopeFromBody(bodyKey: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = requireUser(req);
    if (isSuperAdmin(user.role)) return next();

    const fleetId = (req.body as any)?.[bodyKey];
    if (!fleetId) throw new ApiError(400, `Missing field: ${bodyKey}`);
    if (!user.fleetId) throw new ApiError(403, "User is not scoped to a fleet");
    if (user.fleetId !== String(fleetId)) throw new ApiError(403, "Access denied");
    return next();
  };
}

/**
 * Enforce access to a hub.
 *
 * - SUPER_ADMIN: always allowed
 * - MANAGER: hub must belong to their fleet
 * - OPERATIONS: hub must be in their hubIds list
 */
export function enforceHubAccessFromParam(paramName: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = requireUser(req);
      if (isSuperAdmin(user.role)) return next();

      const hubId = req.params?.[paramName];
      if (!hubId) throw new ApiError(400, `Missing param: ${paramName}`);

      const hub = await prisma.fleetHub.findUnique({
        where: { id: hubId },
        select: { id: true, fleetId: true },
      });
      if (!hub) throw new ApiError(404, "Hub not found");

      if (!user.fleetId) throw new ApiError(403, "User is not scoped to a fleet");

      if (user.role === "MANAGER") {
        if (hub.fleetId !== user.fleetId) throw new ApiError(403, "Access denied");
        return next();
      }

      if (user.role === "OPERATIONS") {
        const hubIds = user.hubIds || [];
        if (!hubIds.includes(hub.id)) throw new ApiError(403, "Access denied");
        return next();
      }

      // default: deny other roles for admin hub operations
      throw new ApiError(403, "Access denied");
    } catch (e) {
      return next(e);
    }
  };
}

/**
 * Enforce access to a driver resource by loading it and checking fleet/hub scope.
 *
 * - SUPER_ADMIN: always allowed
 * - MANAGER: same fleet
 * - OPERATIONS: same fleet (and optionally hub-scoped when driver has hubId and hubIds present)
 */
export function enforceDriverAccessFromParam(paramName: string, opts?: { hubScoped?: boolean }) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = requireUser(req);
      if (isSuperAdmin(user.role)) return next();

      const driverId = req.params?.[paramName];
      if (!driverId) throw new ApiError(400, `Missing param: ${paramName}`);

      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { id: true, fleetId: true, hubId: true },
      });
      if (!driver) throw new ApiError(404, "Driver not found");

      if (!user.fleetId) throw new ApiError(403, "User is not scoped to a fleet");
      if (driver.fleetId !== user.fleetId) throw new ApiError(403, "Access denied");

      if (opts?.hubScoped && user.role === "OPERATIONS") {
        const hubIds = user.hubIds || [];
        if (driver.hubId && !hubIds.includes(driver.hubId)) throw new ApiError(403, "Access denied");
      }

      return next();
    } catch (e) {
      return next(e);
    }
  };
}

export function enforceVehicleAccessFromParam(paramName: string, opts?: { hubScoped?: boolean }) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = requireUser(req);
      if (isSuperAdmin(user.role)) return next();

      const vehicleId = req.params?.[paramName];
      if (!vehicleId) throw new ApiError(400, `Missing param: ${paramName}`);

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, fleetId: true, hubId: true },
      });
      if (!vehicle) throw new ApiError(404, "Vehicle not found");

      if (!user.fleetId) throw new ApiError(403, "User is not scoped to a fleet");
      if (vehicle.fleetId !== user.fleetId) throw new ApiError(403, "Access denied");

      if (opts?.hubScoped && user.role === "OPERATIONS") {
        const hubIds = user.hubIds || [];
        if (vehicle.hubId && !hubIds.includes(vehicle.hubId)) throw new ApiError(403, "Access denied");
      }

      return next();
    } catch (e) {
      return next(e);
    }
  };
}


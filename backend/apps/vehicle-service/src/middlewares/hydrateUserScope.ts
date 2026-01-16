import type { Request, Response, NextFunction } from "express";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";

/**
 * Hydrate `req.user.fleetId` / `req.user.hubIds` from DB if the JWT payload
 * doesn't contain them (e.g. stale/legacy token). This prevents confusing
 * "Fleet scope not set" errors when the DB is correctly configured.
 */
export async function hydrateUserScope(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();

    const role = String(req.user.role || "");
    if (role === "SUPER_ADMIN") return next();

    // If token already has scope, do nothing.
    if (req.user.fleetId) return next();

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new ApiError(401, "User not found");

    req.user.fleetId = user.fleetId ?? null;
    req.user.hubIds = Array.isArray(user.hubIds) ? user.hubIds : [];

    return next();
  } catch (err) {
    return next(err);
  }
}


import type { Request, Response, NextFunction } from "express";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";

export async function hydrateUserScope(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();
    const role = String(req.user.role || "");
    if (role === "SUPER_ADMIN") return next();
    // STRICT VALIDATION: Always check DB to ensure instant revocation
    // if (req.user.fleetId) return next(); <--- REPLACED

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { fleetId: true, hubIds: true, isActive: true }
    });

    if (!user) throw new ApiError(401, "User not found");
    if (!user.isActive) throw new ApiError(403, "User account is inactive");

    req.user.fleetId = user.fleetId ?? null;
    req.user.hubIds = Array.isArray(user.hubIds) ? user.hubIds : [];
    return next();
  } catch (e) {
    return next(e);
  }
}


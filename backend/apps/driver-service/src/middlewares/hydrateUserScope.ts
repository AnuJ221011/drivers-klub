import type { Request, Response, NextFunction } from "express";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";

export async function hydrateUserScope(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();

    const role = String(req.user.role || "");
    if (role === "SUPER_ADMIN") return next();

    if (req.user.fleetId) return next();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: req.user.id }, { shortId: req.user.id }]
      }
    });
    if (!user) throw new ApiError(401, "User not found");

    req.user.fleetId = user.fleetId ?? null;
    req.user.hubIds = Array.isArray(user.hubIds) ? user.hubIds : [];
    return next();
  } catch (err) {
    return next(err);
  }
}


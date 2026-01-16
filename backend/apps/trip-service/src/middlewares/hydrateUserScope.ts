import type { Request, Response, NextFunction } from "express";
import { prisma } from "@driversklub/database";

/**
 * Ensures req.user has fleetId/hubIds even when older JWTs don't.
 * Mirrors the approach used in other services (vehicle/driver/assignment).
 */
export async function hydrateUserScope(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as any;
    if (!user?.id) return next();

    const hasFleetId = typeof user.fleetId === "string" || user.fleetId === null;
    const hasHubIds = Array.isArray(user.hubIds);
    if (hasFleetId && hasHubIds) return next();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fleetId: true, hubIds: true },
    });

    if (dbUser) {
      user.fleetId = dbUser.fleetId ?? null;
      user.hubIds = Array.isArray(dbUser.hubIds) ? dbUser.hubIds : [];
    }
  } catch {
    // best-effort hydration; never block the request here
  }

  return next();
}


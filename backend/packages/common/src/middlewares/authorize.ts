import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

export const authorizeRoles =
    (...allowedRoles: (UserRole | string)[]) =>
        (req: Request, _res: Response, next: NextFunction) => {
            if (!req.user) {
                throw new ApiError(401, "Unauthorized");
            }

            // Convert to strings for comparison to handle both enum and string inputs
            const allowedRoleStrings = allowedRoles.map(r => String(r));
            const userRole = String(req.user.role);

            if (!allowedRoleStrings.includes(userRole)) {
                throw new ApiError(403, "Access denied");
            }

            next();
        };

import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

export const authorizeRoles =
    (...allowedRoles: UserRole[]) =>
        (req: Request, _res: Response, next: NextFunction) => {
            if (!req.user) {
                throw new ApiError(401, "Unauthorized");
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new ApiError(403, "Access denied");
            }

            next();
        };

import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/auth/jwt.util.js";
import { ApiError } from "../utils/apiError.js";

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Authorization token missing");
        }

        const token = authHeader.split(" ")[1];

        const payload = verifyAccessToken(token);

        // Attach decoded user to request (includes scope if present in JWT)
        req.user = {
            id: payload.sub,
            role: payload.role,
            phone: payload.phone,
            fleetId: payload.fleetId,
            hubIds: payload.hubIds,
        };

        next();
    } catch (e) {
        next(e);
    }
};

import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { ApiError } from "../utils/apiError.js";

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Authorization token missing");
    }

    const token = authHeader.split(" ")[1];

    const payload = verifyAccessToken(token);

    // Attach decoded user to request
    req.user = {
        id: payload.sub,
        role: payload.role
    };


    next();
};

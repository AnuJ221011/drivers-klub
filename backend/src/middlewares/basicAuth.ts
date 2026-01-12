import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

/**
 * Basic Authentication Middleware for MMT Inbound APIs
 * Validates the Authorization header against configured credentials.
 */
export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
    // 1. Check for Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        logger.warn(`[BasicAuth] Missing Authorization header for ${req.originalUrl}`);
        res.setHeader('WWW-Authenticate', 'Basic realm="MMT Inbound"');
        return ApiResponse.send(res, 401, null, "Authorization required");
    }

    // 2. Validate format "Basic <base64>"
    const [scheme, credentials] = authHeader.split(' ');

    if (!/^Basic$/i.test(scheme) || !credentials) {
        logger.warn(`[BasicAuth] Invalid Authorization format for ${req.originalUrl}`);
        res.setHeader('WWW-Authenticate', 'Basic realm="MMT Inbound"');
        return ApiResponse.send(res, 401, null, "Invalid authorization format");
    }

    // 3. Decode credentials
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    // 4. Check against Env Vars
    const validUser = process.env.MMT_INBOUND_USERNAME;
    const validPass = process.env.MMT_INBOUND_PASSWORD;

    if (!validUser || !validPass) {
        logger.error("[BasicAuth] Server configuration error: MMT_INBOUND_USERNAME or MMT_INBOUND_PASSWORD not set");
        return ApiResponse.send(res, 500, null, "Internal server configuration error");
    }

    if (username === validUser && password === validPass) {
        return next();
    } else {
        logger.warn(`[BasicAuth] Invalid credentials failed for user: ${username}`);
        res.setHeader('WWW-Authenticate', 'Basic realm="MMT Inbound"');
        return ApiResponse.send(res, 401, null, "Invalid credentials");
    }
};

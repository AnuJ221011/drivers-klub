import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = 500;
    let message = "Internal Server Error";

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Always log server-side (helps debug Postman failures)
    logger.error("Request failed", {
        method: req.method,
        path: req.originalUrl,
        statusCode,
        message,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack
    });

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })
    });
};

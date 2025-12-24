import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.js";
import { Prisma } from "@prisma/client";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = 500;
    let message = "Internal Server Error";

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // Prisma errors are common sources of "500 Internal Server Error".
    // Map them to clearer, actionable messages (without leaking internals in prod).
    if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = "Invalid request";
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = 500;
        message = "Database connection failed";
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // https://www.prisma.io/docs/orm/reference/error-reference
        if (err.code === "P2021" || err.code === "P2022") {
            statusCode = 500;
            message = "Database schema is out of date. Run migrations and regenerate Prisma client.";
        } else {
            statusCode = 500;
            message = "Database query failed";
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            // Include root error message in dev to speed up debugging.
            error: err.message,
            stack: err.stack
        })
    });
};

import type { Express, RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

export const configureSecurity = (app: Express) => {
    app.use(helmet());
    app.use(cors({
        origin: config.cors.allowedOrigins.includes('*') ? '*' : config.cors.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15m
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: "Too Many Requests",
            message: "You have exceeded the request limit.",
            code: "RATE_LIMIT_EXCEEDED"
        }
    }) as unknown as RequestHandler;
    app.use(limiter);
};

export const configureLogging = (app: Express) => {
    app.use(morgan("dev"));
};

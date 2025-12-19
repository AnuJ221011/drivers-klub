import winston from "winston";

const { combine, timestamp, json, errors, colorize, simple } =
    winston.format;

const isProd = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
    level: isProd ? "info" : "debug",
    format: isProd
        ? combine(timestamp(), errors({ stack: true }), json())
        : combine(colorize(), timestamp(), simple()),
    transports: [new winston.transports.Console()]
});

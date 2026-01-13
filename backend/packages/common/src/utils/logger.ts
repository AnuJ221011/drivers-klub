import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'driversklub-backend' },
    transports: [
        new winston.transports.Console({
            format: isProduction
                ? winston.format.json()
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
        })
    ]
});

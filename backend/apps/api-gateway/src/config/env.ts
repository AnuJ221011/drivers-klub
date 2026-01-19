import dotenv from "dotenv";
import path from "path";

// Load .env from root
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

const getEnv = (key: string, _default?: string): string => {
    const val = process.env[key] || _default;
    if (!val) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return val;
};

const LOCALHOST = process.env.SERVICE_HOST || "127.0.0.1";

export const config = {
    port: Number(process.env.PORT) || 3000,
    services: {
        auth: `http://${LOCALHOST}:3001`,
        driver: `http://${LOCALHOST}:3002`,
        vehicle: `http://${LOCALHOST}:3003`,
        assignment: `http://${LOCALHOST}:3004`,
        trip: `http://${LOCALHOST}:3005`,
        notification: `http://${LOCALHOST}:3006`
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : ['*']
    }
};

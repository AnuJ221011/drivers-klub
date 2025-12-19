import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { logger } from "./logger.js";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Prisma 7 with Adapter
export const prisma = new PrismaClient({
    adapter,
    log: ["info"]
});

export const connectDB = async () => {
    try {
        await prisma.$connect();
        logger.info("🟢 Database connected successfully");
    } catch (error) {
        logger.error("🔴 Database connection failed", error);
        process.exit(1);
    }
};

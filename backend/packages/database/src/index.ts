import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Explicitly limit pool size
    idleTimeoutMillis: 30000
});

const adapter = new PrismaPg(pool);

// Prisma 7 with Adapter
export const prisma = new PrismaClient({
    adapter,
    log: ["info", "warn", "error"]
});

export * from '@prisma/client';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000; // Start with 2 seconds
const MAX_RETRY_DELAY_MS = 30000; // Max 30 seconds

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const connectDB = async (): Promise<void> => {
    let lastError: Error | null = null; // Fix: Initialize with null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await prisma.$connect();
            console.log("🟢 Database connected successfully");
            return;
        } catch (error) {
            lastError = error as Error; // Cast to Error
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (attempt < MAX_RETRIES) {
                // Exponential backoff: 2s, 4s, 8s, 16s, 30s (capped)
                const delay = Math.min(RETRY_DELAY_MS * Math.pow(2, attempt - 1), MAX_RETRY_DELAY_MS);
                console.warn(`🔴 Database connection attempt ${attempt}/${MAX_RETRIES} failed: ${errorMessage}`);
                console.log(`   Retrying in ${delay / 1000}s...`);
                await sleep(delay);
            } else {
                const errorMsg = `🔴 Database connection failed after ${MAX_RETRIES} attempts\n   Last error: ${errorMessage}\n   Please check your DATABASE_URL and ensure the database is accessible.`;
                console.error(errorMsg);
                // Give EB time to log the error before exiting
                setTimeout(() => process.exit(1), 2000);
                return;
            }
        }
    }

    if (lastError) {
        throw lastError;
    }
};

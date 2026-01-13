import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// Shared Test Context
export interface TestContext {
    adminToken?: string;
    driverToken?: string;
    fleetId?: string;
    driverId?: string;
    vehicleId?: string;
    tripId?: string;
    assignmentId?: string;
}

export const globalContext: TestContext = {};

export async function apiCall(method: string, url: string, data?: any, token?: string) {
    try {
        const config: any = {
            method,
            url: `${BASE_URL}${url}`,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        };
        if (data) config.data = data;

        const res = await axios(config);
        return { success: true, data: res.data, status: res.status };
    } catch (error: any) {
        let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
        if (typeof errorMessage === 'object') {
            try { errorMessage = JSON.stringify(errorMessage); } catch (e) { /* ignore */ }
        }
        return {
            success: false,
            error: errorMessage,
            status: error.response?.status,
            details: error.response?.data
        };
    }
}


export async function isServerRunning(): Promise<boolean> {
    try {
        await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
        return true;
    } catch (e) {
        return false;
    }
}

export async function startServer() {
    console.log("\n🚀 Checking backend server for testing...");
    if (await isServerRunning()) {
        console.log("   ✅ Server is ready!");
        return;
    }
    console.error("❌ API Gateway not running on port 3000.");
    console.error("   Please start the system (npm run dev:all or npm start) before running tests.");
    throw new Error("Server not running");
}

export async function stopServer() {
    // No-op as we don't start it
}



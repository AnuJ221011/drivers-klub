import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

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
            try { errorMessage = JSON.stringify(errorMessage); } catch (e) { }
        }
        return {
            success: false,
            error: errorMessage,
            status: error.response?.status,
            details: error.response?.data
        };
    }
}

let serverProcess: ChildProcess | null = null;

export async function isServerRunning(): Promise<boolean> {
    try {
        await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
        return true;
    } catch (e) {
        return false;
    }
}

export async function startServer() {
    console.log("\n🚀 Starting backend server for testing...");
    const serverPath = path.join(process.cwd(), "src", "server.ts");

    serverProcess = spawn("npx", ["tsx", serverPath], {
        stdio: "inherit",
        shell: true,
        env: { ...process.env, PORT: "5000" }
    });

    console.log("   Waiting for server to be ready...");
    let retries = 20;
    while (retries > 0) {
        if (await isServerRunning()) {
            console.log("   ✅ Server is ready!");
            return;
        }
        await new Promise(r => setTimeout(r, 1000));
        retries--;
    }
    throw new Error("Server failed to start within 20 seconds");
}

export async function stopServer() {
    if (serverProcess) {
        console.log("\n🛑 Stopping test server...");
        if (process.platform === "win32") {
            try { spawn("taskkill", ["/pid", serverProcess.pid?.toString()!, "/f", "/t"]); } catch (e) { }
        } else {
            serverProcess.kill();
        }
    }
}

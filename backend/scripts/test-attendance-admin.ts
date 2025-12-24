
import axios from "axios";
import dotenv from "dotenv";
import { PrismaClient, UserRole, FleetType } from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

const ADMIN_PHONE = "+919999900001";
const DRIVER_PHONE = "+919999900002";

async function login(phone: string, role: string) {
    // We send verifiedKey = "pass" (value of OTP_BYPASS_KEY in .env)
    const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phone,
        otp: "000000", // Ignored
        verifiedKey: "pass" // Matches .env OTP_BYPASS_KEY
    }).catch(e => {
        if (e.response) {
            console.error(`Login Failed for ${phone}: ${e.response.status} ${JSON.stringify(e.response.data)}`);
            throw e;
        }
        console.error(`Login Failed for ${phone}:`, e.message);
        throw e;
    });

    return res.data;
}

async function seed() {
    console.log("🌱 Seeding Test Data...");

    // 1. Fleet
    let fleet = await prisma.fleet.findFirst({ where: { name: "Test Fleet Inc." } });
    if (!fleet) {
        fleet = await prisma.fleet.create({
            data: {
                name: "Test Fleet Inc.",
                city: "GURGAON",
                mobile: "9999988888",
                panNumber: "ABCDE1234F",
                modeId: "CAB",
                fleetType: FleetType.COMPANY,
                status: "ACTIVE"
            },
        });
    }

    // 2. Admin User
    const adminPhone = ADMIN_PHONE;
    let admin = await prisma.user.findUnique({ where: { phone: adminPhone } });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                phone: adminPhone,
                name: "Test Admin",
                role: UserRole.SUPER_ADMIN,
                isActive: true
            }
        });
    }

    // 3. Driver User & Profile
    const driverPhone = DRIVER_PHONE;
    let driverUser = await prisma.user.findUnique({ where: { phone: driverPhone } });
    if (!driverUser) {
        driverUser = await prisma.user.create({
            data: {
                phone: driverPhone,
                name: "Test Driver",
                role: UserRole.DRIVER,
                isActive: true
            }
        });
    } else {
        // Ensure role is correct
        if (driverUser.role !== UserRole.DRIVER) {
            driverUser = await prisma.user.update({
                where: { id: driverUser.id },
                data: { role: UserRole.DRIVER }
            });
        }
    }

    let driverProfile = await prisma.driver.findFirst({ where: { userId: driverUser.id } });
    if (!driverProfile) {
        await prisma.driver.create({
            data: {
                userId: driverUser.id,
                fleetId: fleet.id,
                firstName: "Test",
                lastName: "Driver",
                mobile: driverPhone,
                licenseNumber: "TESTDL12345",
                isAvailable: true,
                status: "ACTIVE"
            }
        });
    }
    console.log("✅ Seeding Complete");
}

async function main() {
    console.log("🚀 Testing Attendance & Admin Trips...");

    try {
        await seed();

        // =========================================================================
        // 1. LOGIN
        // =========================================================================
        console.log("\n🔐 Logging in...");

        let adminToken, driverToken, driverId;

        // Try Admin Login
        try {
            const adminAuth = await login(ADMIN_PHONE, "SUPER_ADMIN");
            adminToken = adminAuth.data.accessToken;
            console.log("✅ Admin Logged In");
        } catch (e) {
            console.log("⚠️ Admin login failed.");
        }

        // Try Driver Login
        try {
            const driverAuth = await login(DRIVER_PHONE, "DRIVER");
            driverToken = driverAuth.data.accessToken;

            const profileRes = await axios.get(`${BASE_URL}/drivers/me`, {
                headers: { Authorization: `Bearer ${driverToken}` }
            });
            driverId = profileRes.data.data.id;
            console.log(`✅ Driver Logged In (Driver ID: ${driverId})`);
        } catch (e: any) {
            console.error("❌ Driver login failed:", e.message);
            if (e.response) {
                console.error("Response:", e.response.status, JSON.stringify(e.response.data));
            }
            process.exit(1);
        }

        // =========================================================================
        // 2. ATTENDANCE
        // =========================================================================
        console.log("\n📅 Testing Attendance...");

        // Check-In
        console.log("👉 Checking In...");
        let attendanceId;
        try {
            const checkInRes = await axios.post(
                `${BASE_URL}/attendance/check-in`,
                {
                    driverId: driverId,
                    lat: 28.4595,
                    lng: 77.0266,
                    odometer: 10500,
                    selfieUrl: "http://example.com/selfie.jpg"
                },
                { headers: { Authorization: `Bearer ${driverToken}` } }
            );
            console.log("✅ Check-In Success:", checkInRes.data.data.status);
            attendanceId = checkInRes.data.data.id;
        } catch (error: any) {
            if (error.response?.data?.message === "Driver already checked in") {
                console.log("⚠️ Driver was already checked in. Fetching active attendance...");
                const historyRes = await axios.get(`${BASE_URL}/attendance/history?driverId=${driverId}`, {
                    headers: { Authorization: `Bearer ${driverToken}` }
                });
                const active = historyRes.data.data.data.find((a: any) => !a.checkOutTime);
                if (active) {
                    attendanceId = active.id;
                    console.log("Found active ID:", attendanceId);
                }
            } else {
                console.error("❌ Attendance Check-In Failed:", error.response?.data || error.message);
            }
        }

        // Check History
        console.log("👉 Checking History...");
        try {
            const historyRes = await axios.get(`${BASE_URL}/attendance/history?driverId=${driverId}`, {
                headers: { Authorization: `Bearer ${driverToken}` }
            });
            console.log("✅ History Fetched:", historyRes.data.data.data.length, "records");
        } catch (e) { console.error("History failed"); }

        // Approve (Admin)
        if (adminToken && attendanceId) {
            console.log("👉 Admin Approving...");
            try {
                await axios.post(
                    `${BASE_URL}/attendance/${attendanceId}/approve`,
                    { adminId: "admin-uuid-placeholder", remarks: "Good to go" },
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );
                console.log("✅ Attendance Approved");
            } catch (e) {
                console.error("❌ Admin Approve Failed:", (e as any).response?.data || (e as any).message);
            }
        }

        // Check-Out
        console.log("👉 Checking Out...");
        try {
            await axios.post(
                `${BASE_URL}/attendance/check-out`,
                { driverId: driverId, odometer: 10600 },
                { headers: { Authorization: `Bearer ${driverToken}` } }
            );
            console.log("✅ Check-Out Success");
        } catch (e) {
            console.error("❌ Check-Out Failed:", (e as any).response?.data || (e as any).message);
        }


        // =========================================================================
        // 3. ADMIN TRIPS
        // =========================================================================
        if (adminToken) {
            console.log("\n🚖 Testing Admin Get All Trips...");
            try {
                const tripsRes = await axios.get(`${BASE_URL}/admin/trips?limit=5`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log(`✅ Admin Fetched Trips: ${tripsRes.data.data.trips.length} returned (Total: ${tripsRes.data.data.total})`);
            } catch (e: any) {
                console.error("❌ Admin Get Trips Failed:", e.response?.data || e.message);
            }
        }

    } catch (error: any) {
        console.error("Detailed Error:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

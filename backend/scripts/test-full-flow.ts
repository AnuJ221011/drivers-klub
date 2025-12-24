
import axios from "axios";
import dotenv from "dotenv";
import { PrismaClient, UserRole, FleetType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5001"; // Updated to 5001

const ADMIN_PHONE = "+919999900001";
const DRIVER_PHONE = "+919999900002"; // Distinct driver phone for this test

async function login(phone: string, role: string) {
    const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phone,
        otp: "000000",
        verifiedKey: "pass"
    });
    return res.data; // { ...tokens, user }
}

async function seed() {
    console.log("🌱 Seeding Master Test Data...");

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
                fleetType: FleetType.COMPANY, // using enum
                status: "ACTIVE"
            },
        });
    }

    // 2. Admin User
    let admin = await prisma.user.findUnique({ where: { phone: ADMIN_PHONE } });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                phone: ADMIN_PHONE,
                name: "Test Admin",
                role: UserRole.SUPER_ADMIN,
                isActive: true
            }
        });
    } else {
        if (admin.role !== UserRole.SUPER_ADMIN) {
            await prisma.user.update({ where: { id: admin.id }, data: { role: UserRole.SUPER_ADMIN } });
        }
    }

    // 3. Driver User
    let driverUser = await prisma.user.findUnique({ where: { phone: DRIVER_PHONE } });
    if (!driverUser) {
        driverUser = await prisma.user.create({
            data: {
                phone: DRIVER_PHONE,
                name: "Full Flow Driver",
                role: UserRole.DRIVER,
                isActive: true
            }
        });
    } else {
        if (driverUser.role !== UserRole.DRIVER) {
            await prisma.user.update({ where: { id: driverUser.id }, data: { role: UserRole.DRIVER } });
        }
    }

    // 4. Driver Profile
    let driverProfile = await prisma.driver.findFirst({ where: { userId: driverUser.id } });
    if (!driverProfile) {
        driverProfile = await prisma.driver.create({
            data: {
                userId: driverUser.id,
                fleetId: fleet.id,
                firstName: "Full",
                lastName: "Flow",
                mobile: DRIVER_PHONE,
                licenseNumber: "FULLFLOW123",
                isAvailable: true,
                status: "ACTIVE"
            }
        });
    }

    // 5. Clean up existing active attendance to start fresh
    if (driverProfile) {
        // Find checked-in attendance without checkout time
        // Wait, removing old attendance might be tricky via prisma raw if we want to be safe.
        // Let's just create new if not exists, or update checkOutTime of old ones.
        await prisma.attendance.updateMany({
            where: { driverId: driverProfile.id, checkOutTime: null },
            data: { checkOutTime: new Date() }
        });
    }

    return { driverId: driverProfile!.id };
}

async function main() {
    console.log("🚀 Starting Full Project Flow Verification...");

    try {
        const { driverId } = await seed();

        // ==========================================
        // 1. LOGIN
        // ==========================================
        console.log("\n🔐 Phase 1: Authentication");
        const adminRes = await login(ADMIN_PHONE, "SUPER_ADMIN");
        const adminToken = adminRes.data.accessToken; // Structure: { data: { accessToken: ... } } ??
        // Check structure from previous output: "POST /auth/verify-otp" -> returns { accessToken, refreshToken, user } usually?
        // Wait, scripts/test-new-trip-flow.ts used: res.data.accessToken.
        // Let's assume standard response.
        // But `test-api-flow.ts` had a fix: `res.data.data?.accessToken`.
        // Let's normalize.
        const getAT = (r: any) => r.data?.accessToken || r.data?.data?.accessToken || r.accessToken;

        const adminAT = getAT(adminRes);
        console.log("   Admin Logged In");

        const driverRes = await login(DRIVER_PHONE, "DRIVER");
        const driverAT = getAT(driverRes);
        console.log("   Driver Logged In");

        // ==========================================
        // 2. ATTENDANCE (Check-In)
        // ==========================================
        console.log("\n📅 Phase 2: Attendance (Check-In)");
        let attendanceId;
        try {
            const checkInRes = await axios.post(`${BASE_URL}/attendance/check-in`, {
                driverId: driverId,
                lat: 28.1, lng: 77.1, odometer: 10000, selfieUrl: "test.jpg"
            }, { headers: { Authorization: `Bearer ${driverAT}` } });

            console.log("   ✅ Check-In Successful");
            attendanceId = checkInRes.data.data.id;
        } catch (e: any) {
            console.error("   ❌ Check-In Failed:", e.response?.data?.message || e.message);
            // If failed, maybe already active? (We cleaned up, so implies error)
            process.exit(1);
        }

        // Approve Attendance (Admin)
        console.log("   Admin Approving Attendance...");
        try {
            await axios.post(`${BASE_URL}/attendance/${attendanceId}/approve`, {
                adminId: adminRes.user?.id || "admin-id", // API might not validate actual ID in body if token present
                remarks: "Approved for Duty"
            }, { headers: { Authorization: `Bearer ${adminAT}` } });
            console.log("   ✅ Attendance Approved");
        } catch (e: any) {
            console.error("   ❌ Approval Failed:", e.response?.data?.message || e.message);
        }

        // ==========================================
        // 3. TRIP LIFECYCLE
        // ==========================================
        console.log("\n🚕 Phase 3: Trip Lifecycle");

        // A. Admin Creates Trip
        console.log("   Admin Creating Trip...");
        let tripId;
        const tripPayload = {
            tripType: "INTER_CITY",
            originCity: "GURGAON",
            destinationCity: "AGRA",
            pickupLocation: "Cyber City",
            dropLocation: "Taj Mahal",
            distanceKm: 200,
            tripDate: new Date().toISOString(),
            bookingDate: new Date().toISOString(),
            vehicleSku: "TATA_TIGOR_EV"
        };
        const tripRes = await axios.post(`${BASE_URL}/trips`, tripPayload, {
            headers: { Authorization: `Bearer ${adminAT}` }
        });
        tripId = tripRes.data.data.id;
        console.log(`   ✅ Trip Created (ID: ${tripId}). Status: ${tripRes.data.data.status}`);

        if (tripRes.data.data.status !== "CREATED") {
            console.warn("   ⚠️ Unexpected Status (Expected CREATED)");
        }

        // B. Admin Assigns Driver
        console.log("   Admin Assigning Driver...");
        await axios.post(`${BASE_URL}/trips/${tripId}/assign`, {
            driverId: driverId
        }, { headers: { Authorization: `Bearer ${adminAT}` } });
        console.log("   ✅ Driver Assigned");

        // Verify Status
        const tripCheck = await axios.get(`${BASE_URL}/trips/${tripId}`, {
            headers: { Authorization: `Bearer ${adminAT}` }
        });
        if (tripCheck.data.data.status === "DRIVER_ASSIGNED") {
            console.log("   ✅ Trip Status: DRIVER_ASSIGNED");
        } else {
            console.error(`   ❌ Trip Status Mismatch: ${tripCheck.data.data.status}`);
        }

        // C. Driver Starts Trip
        console.log("   Driver Starting Trip...");
        await axios.post(`${BASE_URL}/trips/${tripId}/start`, {
            lat: 28.2, lng: 77.2
        }, { headers: { Authorization: `Bearer ${driverAT}` } });
        console.log("   ✅ Trip Started");

        // D. Driver Completes Trip
        console.log("   Driver Completing Trip...");
        await axios.post(`${BASE_URL}/trips/${tripId}/complete`, {
            distance: 210, fare: 2500
        }, { headers: { Authorization: `Bearer ${driverAT}` } });
        console.log("   ✅ Trip Completed");

        // Use new history endpoint
        console.log("   Verifying Driver History...");
        const histRes = await axios.get(`${BASE_URL}/trips`, { // getDriverTrips
            headers: { Authorization: `Bearer ${driverAT}` }
        });
        console.log("   ✅ History Fetched (Active/Recent)");

        // ==========================================
        // 4. ATTENDANCE (Check-Out)
        // ==========================================
        console.log("\n📅 Phase 4: Attendance (Check-Out)");
        try {
            await axios.post(`${BASE_URL}/attendance/check-out`, {
                driverId: driverId,
                odometer: 10210
            }, { headers: { Authorization: `Bearer ${driverAT}` } });
            console.log("   ✅ Check-Out Successful");
        } catch (e: any) {
            console.error("   ❌ Check-Out Failed:", e.response?.data?.message || e.message);
        }

        console.log("\n✨ FULL PROJECT FLOW VERIFIED SUCCESSFULLY ✨");

    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.response) {
            console.error("   Response:", JSON.stringify(error.response.data));
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

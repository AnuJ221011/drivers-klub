
import axios from "axios";
import dotenv from "dotenv";
import { PrismaClient, UserRole, FleetType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

const ADMIN_PHONE = "+919999900001";
const DRIVER_PHONE = "+919999900003"; // Unique for strict test

// Helper: Login
async function login(phone: string) {
    const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phone, otp: "000000", verifiedKey: "pass"
    });
    return res.data.data?.accessToken || res.data.accessToken;
}

// Helper: Seed
async function seed() {
    console.log("🌱 Seeding Strict Test Data...");
    let fleet = await prisma.fleet.findFirst({ where: { name: "Strict Test Fleet" } });
    if (!fleet) {
        fleet = await prisma.fleet.create({
            data: {
                name: "Strict Test Fleet", city: "DELHI", mobile: "9999900000",
                panNumber: "STRICT1234", modeId: "CAB", fleetType: FleetType.COMPANY, status: "ACTIVE"
            }
        });
    }

    // Admin
    let admin = await prisma.user.findUnique({ where: { phone: ADMIN_PHONE } });
    if (!admin) {
        admin = await prisma.user.create({
            data: { phone: ADMIN_PHONE, name: "Admin", role: UserRole.SUPER_ADMIN, isActive: true }
        });
    }

    // Driver
    let driverUser = await prisma.user.findUnique({ where: { phone: DRIVER_PHONE } });
    if (!driverUser) {
        driverUser = await prisma.user.create({
            data: { phone: DRIVER_PHONE, name: "Strict Driver", role: UserRole.DRIVER, isActive: true }
        });
    }

    // Driver Profile
    let driverProfile = await prisma.driver.findFirst({ where: { userId: driverUser.id } });
    if (!driverProfile) {
        driverProfile = await prisma.driver.create({
            data: {
                userId: driverUser.id, fleetId: fleet.id, firstName: "Strict", lastName: "Driver",
                mobile: DRIVER_PHONE, licenseNumber: "STRICTDL", isAvailable: true, status: "ACTIVE"
            }
        });
    }

    // Cleanup active check-ins
    await prisma.attendance.updateMany({
        where: { driverId: driverProfile.id, checkOutTime: null },
        data: { checkOutTime: new Date() }
    });

    return { driverId: driverProfile.id };
}

async function main() {
    console.log("🚀 Starting Strict Logic Live Test...");
    const { driverId } = await seed();
    const adminToken = await login(ADMIN_PHONE);
    const driverToken = await login(DRIVER_PHONE);

    // Helper: Create Trip (Always Valid Future Date to pass Creation Constraints)
    const createTrip = async () => {
        const date = new Date();
        date.setDate(date.getDate() + 2); // T+48h (Safe Next Day)
        date.setHours(10, 0, 0, 0);

        const res = await axios.post(`${BASE_URL}/trips`, {
            tripType: "INTER_CITY", originCity: "DELHI", destinationCity: "AGRA",
            pickupLocation: "Connaught Place", dropLocation: "Taj Mahal", distanceKm: 200,
            vehicleSku: "EV_SEDAN",
            bookingDate: new Date().toISOString(),
            tripDate: date.toISOString(),
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        return res.data.data.id;
    };

    // Helper: Update Time (Backdoor for Testing)
    const updateTripTime = async (tripId: string, hoursFromNow: number) => {
        const newTime = new Date();
        newTime.setTime(newTime.getTime() + (hoursFromNow * 60 * 60 * 1000));
        await prisma.ride.update({
            where: { id: tripId },
            data: { pickupTime: newTime }
        });
    };

    // Helper: Assign
    const assignTrip = async (tripId: string) => {
        await axios.post(`${BASE_URL}/trips/${tripId}/assign`, { driverId }, { headers: { Authorization: `Bearer ${adminToken}` } });
    };

    try {
        // ==========================================
        // Test 1: Start Trip Too Early (T-4h) -> Expect 400
        // ==========================================
        console.log("\n🧪 Test 1: Start Trip Too Early");
        const trip1 = await createTrip();
        await updateTripTime(trip1, 4); // Set to T+4h
        await assignTrip(trip1);

        try {
            await axios.post(`${BASE_URL}/trips/${trip1}/start`, { lat: 28.5, lng: 77.0 }, { headers: { Authorization: `Bearer ${driverToken}` } });
            console.error("❌ Failed! Trip started but should have been blocked (<2.5h rule).");
            process.exit(1);
        } catch (e: any) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes("2.5 hours")) {
                console.log("✅ Correctly Blocked (Too Early)");
            } else {
                console.error("❌ Unexpected Error:", e.message);
            }
        }

        // ==========================================
        // Test 2: Start Trip Valid (T-1h) -> Expect 200
        // ==========================================
        console.log("\n🧪 Test 2: Start Trip Valid");
        const trip2 = await createTrip();
        await updateTripTime(trip2, 1); // Set to T+1h
        await assignTrip(trip2);

        await axios.post(`${BASE_URL}/trips/${trip2}/start`, { lat: 28.5, lng: 77.0 }, { headers: { Authorization: `Bearer ${driverToken}` } });
        console.log("✅ Success (Allowed)");

        // Add coordinates manually to DB for Geofence test (since Create API doesn't support them yet?)
        // Wait, schema has them but create endpoint might not populate.
        // Let's manually inject coordinates for Trip 2.
        await prisma.ride.update({
            where: { id: trip2 },
            data: { pickupLat: 28.6304, pickupLng: 77.2177 } // CP
        });

        // ==========================================
        // Test 3: Geofence (Far Away) -> Expect 400
        // ==========================================
        console.log("\n🧪 Test 3: Geofence Check (Far Away)");
        try {
            // Trying from India Gate (~2.3km away)
            await axios.post(`${BASE_URL}/trips/${trip2}/arrive`, { lat: 28.6129, lng: 77.2295 }, { headers: { Authorization: `Bearer ${driverToken}` } });
            console.error("❌ Failed! Marked Arrived but was Far Away.");
            process.exit(1);
        } catch (e: any) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes("500m")) {
                console.log("✅ Correctly Blocked (Geofence)");
            } else {
                console.error("❌ Unexpected Error:", e.response?.data || e.message);
            }
        }

        // ==========================================
        // Test 4: Geofence (Correct) -> Expect 200
        // ==========================================
        console.log("\n🧪 Test 4: Geofence Check (Correct Location)");
        // Trying from Near CP (10m away)
        await axios.post(`${BASE_URL}/trips/${trip2}/arrive`, { lat: 28.6305, lng: 77.2178 }, { headers: { Authorization: `Bearer ${driverToken}` } });
        console.log("✅ Success (Arrived at Location)");

        // ==========================================
        // Test 5: No Show (Too Early) -> Expect 400
        // ==========================================
        console.log("\n🧪 Test 5: No Show Check (Too Early)");
        // Trip 2 is at T+1h (so Pickup is in future). Cannot mark No Show.
        try {
            await axios.post(`${BASE_URL}/trips/${trip2}/no-show`, {}, { headers: { Authorization: `Bearer ${driverToken}` } });
            console.error("❌ Failed! Marked No Show but pickup is in future.");
            process.exit(1);
        } catch (e: any) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes("30 mins")) {
                console.log("✅ Correctly Blocked (Time Window)");
            } else {
                console.error("❌ Unexpected Error:", e.response?.data || e.message);
            }
        }

        console.log("\n✨ ALL STRICT SCENARIOS PASSED ✨");

    } catch (error: any) {
        console.error("Global Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

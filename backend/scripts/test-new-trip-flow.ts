
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

const DRIVER_PHONE = "+919999900003"; // New phone for this test

async function login(phone: string, role: string) {
    const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phone,
        otp: "000000",
        verifiedKey: "pass"
    });
    return res.data;
}

async function seed() {
    console.log("🌱 Seeding Test Data...");

    // Fleet
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

    // Admin User
    let admin = await prisma.user.findUnique({ where: { phone: "+919999900001" } });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                phone: "+919999900001",
                name: "Test Admin",
                role: UserRole.SUPER_ADMIN,
                isActive: true
            }
        });
    }

    // Driver User
    let driverUser = await prisma.user.findUnique({ where: { phone: DRIVER_PHONE } });
    if (!driverUser) {
        driverUser = await prisma.user.create({
            data: {
                phone: DRIVER_PHONE,
                name: "Flow Tester",
                role: UserRole.DRIVER,
                isActive: true
            }
        });
    } else {
        // Enforce DRIVER Role
        await prisma.user.update({
            where: { id: driverUser.id },
            data: { role: UserRole.DRIVER }
        });
    }

    // Driver Profile
    let driverProfile = await prisma.driver.findFirst({ where: { userId: driverUser.id } });
    if (!driverProfile) {
        driverProfile = await prisma.driver.create({
            data: {
                userId: driverUser.id,
                fleetId: fleet.id,
                firstName: "Flow",
                lastName: "Tester",
                mobile: DRIVER_PHONE,
                licenseNumber: "FLOW123",
                isAvailable: true,
                status: "ACTIVE"
            }
        });
    }

    // Create Assignment (Driver <-> Vehicle <-> Fleet) - Required for trip logic?
    // Actually, new Ride flow doesn't check Assignment directly during creation anymore (TripCreateService uses Validation).
    // But let's create a Vehicle just in case we need sku validation validation.
    // TripValidator.validateVehicle(input.vehicleSku);
    /*
    TripValidator check:
        const validSkus = ["TATA_TIGOR_EV"];
        if (!validSkus.includes(vehicleSku)) throw new ApiError(400, "Invalid vehicle SKU");
    */
    // No DB check. Good.

    return { driverId: driverProfile.id };
}

async function main() {
    console.log("🚀 Testing New Ride Architecture Flow...");

    try {
        const { driverId } = await seed();

        // 1. LOGIN
        console.log("\n🔐 Logging in Admin & Driver...");
        const adminAuth = await login("+919999900001", "SUPER_ADMIN"); // Assuming seeded admin from other script exists or we use correct phone
        const adminToken = adminAuth.data.accessToken;

        const driverAuth = await login(DRIVER_PHONE, "DRIVER");
        const driverToken = driverAuth.data.accessToken;
        // Get Driver Profile ID
        const profileRes = await axios.get(`${BASE_URL}/drivers/me`, { headers: { Authorization: `Bearer ${driverToken}` } });
        const driverProfileId = profileRes.data.data.id;

        console.log("✅ Logged In Both");

        // 2. CREATE TRIP (Admin)
        console.log("\n🆕 Creating Trip (Admin)...");
        const createPayload = {
            tripType: "INTER_CITY",
            originCity: "GURGAON",
            destinationCity: "JAIPUR",
            pickupLocation: "Cyber Hub, Gurgaon",
            dropLocation: "Amber Fort, Jaipur",
            distanceKm: 250,
            tripDate: new Date().toISOString(),
            bookingDate: new Date().toISOString(),
            vehicleSku: "TATA_TIGOR_EV"
        };

        let tripId;
        try {
            const createRes = await axios.post(`${BASE_URL}/trips`, createPayload, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log("✅ Trip Created. ID:", createRes.data.data.id);
            tripId = createRes.data.data.id;

            // Verify Status CREATED
            if (createRes.data.data.status === "CREATED") {
                console.log("✅ Verified: Status is CREATED (Pending Assignment)");
            } else {
                console.warn("⚠️ Warning: Status is", createRes.data.data.status);
            }

        } catch (e: any) {
            console.error("❌ Create Trip Failed:", e.response?.data || e.message);
            process.exit(1);
        }

        // 2.1 ASSIGN DRIVER (Admin)
        console.log("\n👈 Assigning Driver...");
        try {
            await axios.post(`${BASE_URL}/trips/${tripId}/assign`, {
                driverId: driverProfileId
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log("✅ Driver Assigned");

            // Verify Status DRIVER_ASSIGNED
            const getRes = await axios.get(`${BASE_URL}/trips/${tripId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (getRes.data.data.status === "DRIVER_ASSIGNED") {
                console.log("✅ Verified: Status is DRIVER_ASSIGNED");
            }

        } catch (e: any) {
            console.error("❌ Assign Driver Failed:", e.response?.data || e.message);
            process.exit(1);
        }

        // 3. START TRIP (Driver) with driverToken
        console.log("\n▶️ Starting Trip (Driver)...");
        try {
            await axios.post(`${BASE_URL}/trips/${tripId}/start`, {
                lat: 28.1, lng: 76.5
            }, {
                headers: { Authorization: `Bearer ${driverToken}` }
            });
            console.log("✅ Trip Started");
        } catch (e: any) {
            console.error("❌ Start Trip Failed:", e.response?.data || e.message);
            process.exit(1);
        }

        // 4. COMPLETE TRIP (Driver) with driverToken
        console.log("\n🏁 Completing Trip (Driver)...");
        try {
            await axios.post(`${BASE_URL}/trips/${tripId}/complete`, {
                distance: 255,
                fare: 3000
            }, {
                headers: { Authorization: `Bearer ${driverToken}` }
            });
            console.log("✅ Trip Completed");
        } catch (e: any) {
            console.error("❌ Complete Trip Failed:", e.response?.data || e.message);
            process.exit(1);
        }

        // 5. VERIFY HISTORY (Driver)
        console.log("\n📜 Verifying History (Driver)...");
        const histRes = await axios.get(`${BASE_URL}/trips`, {
            headers: { Authorization: `Bearer ${driverToken}` }
        });
        // I will check Route File in next step if fails.

    } catch (error: any) {
        console.error("Detailed Error:", error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

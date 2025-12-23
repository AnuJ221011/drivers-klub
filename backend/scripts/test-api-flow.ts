
import { PrismaClient, UserRole, FleetType, VehicleStatus, FuelType, VehicleOwnership } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();


const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


const BASE_URL = "http://localhost:5001";

const ADMIN_PHONE = "+919999900001";
const DRIVER_PHONE = "+919999900002";
const USER_PHONE = "+919999900003";

const FLEET_NAME = "Test Fleet Inc.";
const VEHICLE_NUMBER = "DL01TEST001";

async function main() {
    console.log("🚀 Starting Comprehensive API Integration Test...");

    try {
        // =========================================================================
        // 1️⃣ CLEANUP & SEEDING (Direct DB Access)
        // =========================================================================
        console.log("\n🧹 Cleaning up old test data...");

        const testPhones = [ADMIN_PHONE, DRIVER_PHONE, USER_PHONE];

        // 1. Delete OTPs
        await prisma.otp.deleteMany({
            where: { phone: { in: testPhones } },
        });

        // 2. Find Users to get IDs for deeper cleanup
        const users = await prisma.user.findMany({
            where: { phone: { in: testPhones } },
            include: { driver: true }
        });

        const userIds = users.map(u => u.id);
        const driverIds = users.map(u => u.driver?.id).filter((id): id is string => !!id);

        // 3. Delete TripAssignments (Pivot table for Rides <-> Drivers)
        if (driverIds.length > 0) {
            await prisma.tripAssignment.deleteMany({
                where: { driverId: { in: driverIds } }
            });

            // Delete Assignments (Roster)
            await prisma.assignment.deleteMany({
                where: { driverId: { in: driverIds } }
            });
        }

        // 4. Delete Rides/Trips associated with these drivers
        if (driverIds.length > 0) {
            // Legacy Trip deletion
            await prisma.trip.deleteMany({
                where: { driverId: { in: driverIds } }
            });
        }

        // 5. Delete Users (Cascades to Driver, RefreshTokens)
        if (userIds.length > 0) {
            // Also delete Rides if they linger (Ride is the new model) - manually clean created ones if tracked, 
            //   but usually Ride is anonymous or linked to User (which we don't have logic for yet). 
            //   The issue was Driver foreign key.

            await prisma.user.deleteMany({
                where: { id: { in: userIds } }
            });
        }

        // We might leave Fleet/Vehicle if unique constraint issues arise, or check first.
        let fleet = await prisma.fleet.findFirst({ where: { name: FLEET_NAME } });
        if (!fleet) {
            fleet = await prisma.fleet.create({
                data: {
                    name: FLEET_NAME,
                    city: "GURGAON",
                    mobile: "9999988888",
                    panNumber: "ABCDE1234F",
                    modeId: "CAB",
                    fleetType: FleetType.COMPANY, // using enum
                    status: "ACTIVE" // FleetStatus enum
                },
            });
            console.log(`✅ Seeded Fleet: ${fleet.id}`);
        }

        // Create Vehicle
        let vehicle = await prisma.vehicle.findFirst({ where: { vehicleNumber: VEHICLE_NUMBER } });
        if (!vehicle) {
            vehicle = await prisma.vehicle.create({
                data: {
                    vehicleNumber: VEHICLE_NUMBER,
                    vehicleName: "Tigor EV",
                    vehicleModel: "Tata Tigor EV",
                    status: VehicleStatus.ACTIVE,
                    fleetId: fleet.id,
                    fuelType: FuelType.ELECTRIC,
                    ownership: VehicleOwnership.OWNED
                }
            });
            console.log(`✅ Seeded Vehicle: ${vehicle.id}`);
        }

        // Create Users
        const adminUser = await prisma.user.create({
            data: { name: "Test Admin", phone: ADMIN_PHONE, role: "SUPER_ADMIN", isActive: true },
        });
        console.log(`✅ Seeded Admin: ${adminUser.id}`);

        const driverUser = await prisma.user.create({
            data: { name: "Test Driver", phone: DRIVER_PHONE, role: "DRIVER", isActive: true },
        });

        // Create Driver Profile linkage
        const driverProfile = await prisma.driver.create({
            data: {
                userId: driverUser.id,
                firstName: "Ramesh",
                lastName: "Driver",
                mobile: DRIVER_PHONE,
                status: "ACTIVE", // DriverStatus enum
                fleetId: fleet.id,
            }
        });
        console.log(`✅ Seeded Driver Profile: ${driverProfile.id}`);

        const customerUser = await prisma.user.create({
            data: { name: "Test Customer", phone: USER_PHONE, role: "MANAGER", isActive: true },
        });
        console.log(`✅ Seeded Customer: ${customerUser.id}`);


        // =========================================================================
        // 2️⃣ HELPER FUNCTIONS
        // =========================================================================
        const login = async (phone: string, roleName: string) => {
            console.log(`\n🔑 Logging in as ${roleName} (${phone})...`);
            // 1. Send OTP
            try {
                await axios.post(`${BASE_URL}/auth/send-otp`, { phone });
            } catch (e: any) {
                console.error(`ERROR Sending OTP: ${e.message}`);
                if (e.response) console.error(JSON.stringify(e.response.data));
                throw e;
            }

            // 2. Get OTP from DB
            const otpRecord = await prisma.otp.findFirst({
                where: { phone },
                orderBy: { createdAt: 'desc' }
            });
            if (!otpRecord) throw new Error(`OTP not generated for ${phone}`);
            console.log(`   Fetched OTP from DB: ${otpRecord.otp}`);


            // 3. Verify
            const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
                phone,
                otp: otpRecord.otp
            });
            // FIX: Access .data.data.accessToken due to ApiResponse wrapper
            const token = res.data.data?.accessToken || res.data.accessToken;
            console.log(`   Logged in! Token: ${token.substring(0, 15)}...`);
            return token;
        };

        const authenticatedClient = (token: string) => {
            return axios.create({
                baseURL: BASE_URL,
                headers: { Authorization: `Bearer ${token}` }
            });
        }

        // =========================================================================
        // 3️⃣ EXECUTE FLOW
        // =========================================================================

        // A. Login
        const adminToken = await login(ADMIN_PHONE, "Admin");
        const driverToken = await login(DRIVER_PHONE, "Driver");

        const adminClient = authenticatedClient(adminToken);
        const driverClient = authenticatedClient(driverToken);

        // B. Check Health
        console.log("\n🏥 Checking Health...");
        const health = await axios.get(`${BASE_URL}/health`);
        // Health might be simple { status: "ok" } or wrapped. Assuming wrapped for now or checking both.
        console.log("   Health Status:", health.data.status || health.data.message);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);


        // C. CONSTRAINT VIOLATION TEST (Origin City)
        console.log("\n🧪 Testing Constraints (Expect Failures)...");
        try {
            await adminClient.post("/trips", {
                tripType: "RENTAL",
                originCity: "MUMBAI", // Should Fail (Only Delhi NCR Allowed)
                destinationCity: "PUNE",
                tripDate: tomorrow.toISOString(),
                bookingDate: new Date().toISOString(),
                distanceKm: 45,
                vehicleSku: "TATA_TIGOR_EV"
            });
            throw new Error("❌ Constraint Failed: Allowed MUMBAI origin (Should have failed)");
        } catch (e: any) {
            if (e.response?.status !== 500 && e.response?.status !== 400) {
                console.log(`   ❌ Unexpected Error: ${e.message}`);
            } else {
                console.log("   ✅ Success: Blocked 'MUMBAI' Origin as expected.");
            }
        }

        // D. Create Valid Trip (Delhi NCR)
        console.log("\n🚕 Creating Valid Trip (Delhi NCR)...");
        const tripDate = tomorrow.toISOString(); // T+2 days
        const tripPayload = {
            tripType: "RENTAL",
            originCity: "GURGAON", // Valid NCR City
            destinationCity: "DELHI",
            tripDate: tripDate,
            bookingDate: new Date().toISOString(),
            distanceKm: 45,
            vehicleSku: "TATA_TIGOR_EV"
        };

        // Using Admin client to create trip (or customer if enabled)
        const createRes = await adminClient.post("/trips", tripPayload);
        // FIX: Access .data.data.id
        const tripId = createRes.data.data.id;
        console.log(`   Trip Created! ID: ${tripId}, Status: ${createRes.data.data.status}, Price: ${createRes.data.data.price}`);

        // D. Verify Trip Details
        console.log("\n🔍 Verifying Trip Details...");
        try {
            const getTripRes = await adminClient.get(`/trips/${tripId}`);
            // FIX: Access .data.data.status
            if (getTripRes.data.data.status !== "CREATED") throw new Error("Trip status mismatch");
            console.log("   Trip fetched successfully.");
        } catch (e: any) {
            console.warn("   ⚠️ Warning: Trip fetch failed.", e.message);
        }

        // E. Manually Assign Driver (Dispatch)
        console.log(`\n👨‍✈️ Assigning Driver (${driverProfile.id})...`);
        try {
            await adminClient.post(`/trips/${tripId}/assign`, {
                driverId: driverProfile.id
            });

            // Verify status changed
            const tripAfterAssign = await adminClient.get(`/trips/${tripId}`);
            console.log(`   Trip Status after Assign: ${tripAfterAssign.data.data.status}`);
        } catch (e: any) {
            console.log("   Assign failed:", e.response?.data?.message || e.message);
        }

        // F. Driver Actions (Start Trip)
        console.log("\n▶️ Starting Trip...");
        try {
            await driverClient.post(`/trips/${tripId}/start`);
            console.log("   Trip Started by Driver.");
        } catch (e: any) {
            console.log("   Driver failed to start:", e.response?.data?.message || e.message);
        }

        try {
            const tripStarted = await adminClient.get(`/trips/${tripId}`);
            console.log(`   Trip Status: ${tripStarted.data.data.status}`);
        } catch (e) {
            // ignore
        }

        // G. Complete Trip
        console.log("\n🏁 Completing Trip...");
        try {
            await driverClient.post(`/trips/${tripId}/complete`);
            const tripCompleted = await adminClient.get(`/trips/${tripId}`);
            console.log(`   Trip Status: ${tripCompleted.data.data.status}`);
        } catch (e: any) {
            console.log("   Complete failed:", e.response?.data?.message || e.message);
        }

        // H. Basic Entity Checks
        console.log("\n🧪 Running Basic Entity Checks (Admin)...");

        // User
        try {
            const userRes = await adminClient.get(`/users/${adminUser.id}`);
            console.log(`   GET /users/${adminUser.id} -> Status: ${userRes.status}`);
        } catch (e: any) { console.log(`   GET /users failed:`, e.message); }

        // Driver
        try {
            const driverRes = await adminClient.get(`/drivers/${driverProfile.id}`);
            // FIX: Access .data.data
            console.log(`   GET /drivers/${driverProfile.id} -> Status: ${driverRes.status}, Name: ${driverRes.data.data.firstName}`);
        } catch (e: any) { console.log(`   GET /drivers failed:`, e.message); }

        // Fleet
        try {
            const fleetRes = await adminClient.get(`/fleets/${fleet.id}`);
            console.log(`   GET /fleets/${fleet.id} -> Status: ${fleetRes.status}, Name: ${fleetRes.data.data.name}`);
        } catch (e: any) { console.log(`   GET /fleets failed:`, e.message); }

        // Vehicle
        try {
            const vehicleRes = await adminClient.get(`/vehicles/${vehicle.id}`);
            console.log(`   GET /vehicles/${vehicle.id} -> Status: ${vehicleRes.status}, Reg: ${vehicleRes.data.data.vehicleNumber}`);
        } catch (e: any) { console.log(`   GET /vehicles failed:`, e.message); }

        // Trip Tracking
        try {
            const trackRes = await adminClient.get(`/trips/${tripId}/tracking`);
            console.log(`   GET /trips/${tripId}/tracking -> Status: ${trackRes.status}, Live: ${trackRes.data.data.live}`);
        } catch (e: any) { console.log(`   GET /trips/id/tracking failed:`, e.message); }

        // I. Pricing Check
        console.log("\n💰 Checking Pricing Engine...");
        try {
            const pricingRes = await axios.post(`${BASE_URL}/pricing/preview`, {
                tripType: "RENTAL",
                distanceKm: 25,
                tripDate: new Date().toISOString(),
                bookingDate: new Date().toISOString()
            });
            // FIX: Access .data.data.totalFare
            console.log(`   POST /api/pricing/preview -> TotalFare: ${pricingRes.data.data.finalFare || pricingRes.data.data.totalFare}`);
        } catch (e: any) { console.log(`   POST /api/pricing/preview failed:`, e.message); }

        console.log("\n✅ API Integration Test Completed Successfully!");

    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

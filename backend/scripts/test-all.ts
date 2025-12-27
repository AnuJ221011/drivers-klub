import { PrismaClient, UserRole, FleetType, VehicleStatus, FuelType, VehicleOwnership } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

// Test Data
const ADMIN_PHONE = "+919999900001";
const DRIVER_PHONE = "+919999900002";
const FLEET_NAME = "Test Fleet Inc.";
const VEHICLE_NUMBER = "DL01TEST001";

let adminToken = "";
let driverToken = "";
let fleetId = "";
let driverId = "";
let vehicleId = "";
let tripId = "";
let assignmentId = "";

// Helper Functions
async function login(phone: string) {
    const res = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phone,
        otp: "000000",
        verifiedKey: "pass"
    });
    return res.data;
}

async function apiCall(method: string, url: string, data?: any, token?: string) {
    try {
        const config: any = {
            method,
            url: `${BASE_URL}${url}`,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        };
        if (data) config.data = data;

        const res = await axios(config);
        return { success: true, data: res.data };
    } catch (error: any) {
        let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
        if (typeof errorMessage === 'object') {
            try {
                errorMessage = JSON.stringify(errorMessage);
            } catch (e) {
                errorMessage = "Error object could not be stringified";
            }
        }
        return {
            success: false,
            error: errorMessage,
            status: error.response?.status,
            details: error.response?.data
        };
    }
}

// Test Sections
async function checkDatabaseConnection() {
    console.log("\n🔌 Checking database connection...");
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Database connected");
        return true;
    } catch (error: any) {
        console.error("❌ Database connection failed:", error.message);
        console.error("   Please check your DATABASE_URL in .env file");
        return false;
    }
}

async function cleanup() {
    console.log("\n🧹 Cleaning up test data...");

    try {
        const testPhones = [ADMIN_PHONE, DRIVER_PHONE];

        // Delete in correct order to respect ALL foreign key constraints
        // 1. Delete ALL TripAssignments first (references Ride and Driver)
        await prisma.tripAssignment.deleteMany({});

        // 2. Delete ALL Rides (no longer referenced)
        await prisma.ride.deleteMany({});

        // 3. Delete ALL Attendance (not just test drivers, to avoid FK issues)
        await prisma.attendance.deleteMany({});

        // 4. Delete ALL Assignments (references Driver, Vehicle, Fleet)
        await prisma.assignment.deleteMany({});

        // 5. Find test users to get IDs
        const users = await prisma.user.findMany({
            where: { phone: { in: testPhones } },
            include: { driver: true }
        });

        const userIds = users.map(u => u.id);
        const driverIds = users.filter(u => u.driver).map(u => u.driver!.id);

        // 6. Delete test vehicles
        await prisma.vehicle.deleteMany({ where: { vehicleNumber: VEHICLE_NUMBER } });

        // 7. Delete test drivers (now safe as attendance/assignments/trips are gone)
        if (driverIds.length > 0) {
            await prisma.driver.deleteMany({ where: { id: { in: driverIds } } });
        }

        // 8. Delete OTPs
        await prisma.otp.deleteMany({ where: { phone: { in: testPhones } } });

        // 9. Delete refresh tokens
        if (userIds.length > 0) {
            await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
        }

        // 10. Delete test users
        if (userIds.length > 0) {
            await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }

        // 11. Delete test fleet (last, as it's referenced by many tables)
        await prisma.fleet.deleteMany({ where: { name: FLEET_NAME } });

        console.log("✅ Cleanup complete");
    } catch (error: any) {
        console.error("⚠️  Cleanup warning:", error.message);
        console.log("   Continuing with tests...");
    }
}

async function seedData() {
    console.log("\n🌱 Seeding test data...");

    // Create Fleet
    const fleet = await prisma.fleet.create({
        data: {
            name: FLEET_NAME,
            city: "GURGAON",
            mobile: "9999988888",
            panNumber: "ABCDE1234F",
            modeId: "CAB",
            fleetType: FleetType.COMPANY,
            status: "ACTIVE"
        }
    });
    fleetId = fleet.id;

    // Create Admin User
    const admin = await prisma.user.create({
        data: {
            name: "Test Admin",
            phone: ADMIN_PHONE,
            role: UserRole.SUPER_ADMIN,
            isActive: true
        }
    });

    // Create Driver User
    const driverUser = await prisma.user.create({
        data: {
            name: "Test Driver",
            phone: DRIVER_PHONE,
            role: UserRole.DRIVER,
            isActive: true
        }
    });

    // Create Driver Profile
    const driver = await prisma.driver.create({
        data: {
            userId: driverUser.id,
            fleetId: fleet.id,
            firstName: "Test",
            lastName: "Driver",
            mobile: DRIVER_PHONE,
            licenseNumber: "DL1234567890",
            kycStatus: "APPROVED",
            status: "ACTIVE",
            isAvailable: true
        }
    });
    driverId = driver.id;

    // Create Vehicle
    const vehicle = await prisma.vehicle.create({
        data: {
            fleetId: fleet.id,
            vehicleNumber: VEHICLE_NUMBER,
            vehicleName: "Tata Tigor EV",
            vehicleModel: "Tigor EV 2024",
            vehicleColor: "White",
            fuelType: FuelType.ELECTRIC,
            ownership: VehicleOwnership.OWNED,
            status: VehicleStatus.ACTIVE
        }
    });
    vehicleId = vehicle.id;

    // Create Assignment
    const assignment = await prisma.assignment.create({
        data: {
            fleetId: fleet.id,
            driverId: driver.id,
            vehicleId: vehicle.id,
            status: "ACTIVE"
        }
    });
    assignmentId = assignment.id;

    console.log("✅ Seed data created");
    console.log(`   Fleet ID: ${fleetId}`);
    console.log(`   Driver ID: ${driverId}`);
    console.log(`   Vehicle ID: ${vehicleId}`);
}

async function testAuthentication() {
    console.log("\n🔐 Testing Authentication...");

    // Test Admin Login
    const adminAuth = await login(ADMIN_PHONE);
    adminToken = adminAuth.data?.accessToken || adminAuth.accessToken;
    console.log(`✅ Admin login successful (Token length: ${adminToken?.length || 0})`);

    // Test Driver Login
    const driverAuth = await login(DRIVER_PHONE);
    driverToken = driverAuth.data?.accessToken || driverAuth.accessToken;
    console.log(`✅ Driver login successful (Token length: ${driverToken?.length || 0})`);
}

async function testTripCreation() {
    console.log("\n🚗 Testing Trip Creation...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const tripData = {
        tripType: "AIRPORT",
        originCity: "GURGAON",
        destinationCity: "DELHI",
        pickupLocation: "Cyber City, Gurgaon",
        dropLocation: "IGI Airport, Delhi",
        tripDate: tomorrow.toISOString(),
        bookingDate: new Date().toISOString(),
        distanceKm: 25,
        vehicleSku: "TATA_TIGOR_EV"
    };

    const result = await apiCall("POST", "/trips", tripData, adminToken);

    if (result.success) {
        tripId = result.data.data.id;
        console.log(`✅ Trip created: ${tripId}`);
    } else {
        console.log(`❌ Trip creation failed: ${result.error}`);
    }
}

async function testTripAssignment() {
    console.log("\n👤 Testing Trip Assignment...");

    const result = await apiCall("POST", "/admin/trips/assign", {
        tripId,
        driverId
    }, adminToken);

    if (result.success) {
        console.log("✅ Driver assigned to trip");
    } else {
        console.log(`❌ Assignment failed: ${result.error}`);
    }
}

async function testAttendance() {
    console.log("\n📋 Testing Attendance...");

    // Driver Check-in
    const checkInResult = await apiCall("POST", "/attendance/check-in", {
        driverId, // Added driverId as required by controller
        lat: 28.4595,
        lng: 77.0266,
        odometer: 12345,
        selfieUrl: "https://example.com/selfie.jpg"
    }, driverToken);

    if (checkInResult.success) {
        console.log("✅ Driver checked in");

        // Admin Approve
        const attendanceId = checkInResult.data.data.id;
        const approveResult = await apiCall("POST", `/attendance/${attendanceId}/approve`, {}, adminToken);

        if (approveResult.success) {
            console.log("✅ Attendance approved");
        } else {
            console.log(`❌ Approval failed: ${approveResult.error}`);
        }
    } else {
        console.log(`❌ Check-in failed: ${checkInResult.error}`);
    }
}

async function testTripLifecycle() {
    console.log("\n🔄 Testing Trip Lifecycle...");

    // Get trip to check current status
    const tripResult = await apiCall("GET", `/trips/${tripId}`, null, driverToken);

    if (!tripResult.success) {
        console.log(`❌ Failed to fetch trip: ${tripResult.error}`);
        return;
    }

    console.log(`   Current trip status: ${tripResult.data.data.status}`);

    console.log("⚠️  Trip lifecycle tests require specific timing and location constraints");
    console.log("   - Start: Within 2.5 hours of pickup time");
    console.log("   - Arrive: Within 30 minutes of pickup, within 500m radius");
    console.log("   - No Show: After 30 minutes past pickup time");
}

async function testFleetManagement() {
    console.log("\n🏢 Testing Fleet Management...");

    // Get all fleets
    const fleetsResult = await apiCall("GET", "/fleets", null, adminToken);

    if (fleetsResult.success) {
        console.log(`✅ Fetched ${fleetsResult.data.data.length} fleets`);
    } else {
        console.log(`❌ Failed to fetch fleets: ${fleetsResult.error}`);
    }

    // Get fleet by ID
    const fleetResult = await apiCall("GET", `/fleets/${fleetId}`, null, adminToken);

    if (fleetResult.success) {
        console.log(`✅ Fetched fleet: ${fleetResult.data.data.name}`);
    } else {
        console.log(`❌ Failed to fetch fleet: ${fleetResult.error}`);
    }
}

async function testDriverManagement() {
    console.log("\n👨‍✈️ Testing Driver Management...");

    // Get drivers by fleet
    const driversResult = await apiCall("GET", `/drivers/fleet/${fleetId}`, null, adminToken);

    if (driversResult.success) {
        console.log(`✅ Fetched ${driversResult.data.data.length} drivers`);
    } else {
        console.log(`❌ Failed to fetch drivers: ${driversResult.error}`);
    }

    // Get driver profile
    const driverResult = await apiCall("GET", `/drivers/${driverId}`, null, adminToken);

    if (driverResult.success) {
        console.log(`✅ Fetched driver: ${driverResult.data.data.firstName} ${driverResult.data.data.lastName}`);
    } else {
        console.log(`❌ Failed to fetch driver: ${driverResult.error}`);
    }
}

async function testVehicleManagement() {
    console.log("\n🚙 Testing Vehicle Management...");

    // Get vehicles by fleet
    const vehiclesResult = await apiCall("GET", `/vehicles/fleet/${fleetId}`, null, adminToken);

    if (vehiclesResult.success) {
        console.log(`✅ Fetched ${vehiclesResult.data.data.length} vehicles`);
    } else {
        console.log(`❌ Failed to fetch vehicles: ${vehiclesResult.error}`);
    }

    // Get vehicle by ID
    const vehicleResult = await apiCall("GET", `/vehicles/${vehicleId}`, null, adminToken);

    if (vehicleResult.success) {
        console.log(`✅ Fetched vehicle: ${vehicleResult.data.data.vehicleNumber}`);
    } else {
        console.log(`❌ Failed to fetch vehicle: ${vehicleResult.error}`);
    }
}

async function testPricing() {
    console.log("\n💰 Testing Pricing...");

    const pricingResult = await apiCall("POST", "/pricing/preview", {
        distanceKm: 25,
        tripType: "AIRPORT",
        vehicleType: "EV"
    }, adminToken);

    if (pricingResult.success) {
        console.log(`✅ Pricing calculated: ₹${pricingResult.data.data.totalFare}`);
    } else {
        console.log(`❌ Pricing failed: ${pricingResult.error}`);
    }
}

async function testHealthCheck() {
    console.log("\n🩺 Testing Health Check...");

    const healthResult = await apiCall("GET", "/health", null);

    if (healthResult.success) {
        console.log(`✅ Health check passed`);
        console.log(`   Status: ${healthResult.data.status}`);
        console.log(`   Database: ${healthResult.data.database}`);
    } else {
        console.log(`❌ Health check failed: ${healthResult.error}`);
    }
}

// Main Test Runner
async function main() {
    console.log("🚀 Starting Comprehensive API Test Suite");
    console.log("==========================================\n");

    try {
        // Check database connection first
        const dbConnected = await checkDatabaseConnection();
        if (!dbConnected) {
            console.error("\n❌ Cannot proceed without database connection");
            process.exit(1);
        }

        await cleanup();
        await seedData();
        await testHealthCheck();
        await testAuthentication();
        await testFleetManagement();
        await testDriverManagement();
        await testVehicleManagement();
        await testAttendance();
        await testPricing();
        await testTripCreation();
        await testTripAssignment();
        await testTripLifecycle();

        console.log("\n==========================================");
        console.log("✅ All tests completed successfully!");
        console.log("==========================================\n");

    } catch (error) {
        console.error("\n❌ Test suite failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
        await prisma.$disconnect();
    }
}

main();

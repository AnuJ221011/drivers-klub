import { PrismaClient, UserRole, FleetType, VehicleStatus, FuelType, VehicleOwnership } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createCompleteDriver() {
    console.log("🚀 Creating Complete Driver Profile...\n");

    try {
        // 1. Create or get Fleet
        console.log("1️⃣ Creating Fleet...");
        const fleet = await prisma.fleet.upsert({
            where: { mobile: "9876543210" },
            update: {},
            create: {
                name: "Demo Fleet Pvt Ltd",
                city: "GURGAON",
                mobile: "9876543210",
                panNumber: "ABCDE1234F",
                modeId: "CAB",
                fleetType: FleetType.COMPANY,
                status: "ACTIVE"
            }
        });
        console.log(`✅ Fleet created: ${fleet.name} (ID: ${fleet.id})\n`);

        // 2. Create User for Driver
        console.log("2️⃣ Creating User Account...");
        const user = await prisma.user.upsert({
            where: { phone: "9876543210" },
            update: {},
            create: {
                name: "Rajesh Kumar",
                phone: "9876543210",
                role: UserRole.DRIVER,
                isActive: true
            }
        });
        console.log(`✅ User created: ${user.name} (ID: ${user.id})\n`);

        // 3. Create Complete Driver Profile
        console.log("3️⃣ Creating Complete Driver Profile...");
        const driver = await prisma.driver.upsert({
            where: { userId: user.id },
            update: {
                firstName: "Rajesh",
                lastName: "Kumar",
                mobile: "9876543210",
                licenseNumber: "DL-0120230012345",

                // Document Images
                profilePic: "https://example.com/photos/rajesh-kumar.jpg",
                licenseFront: "https://example.com/docs/license-rajesh-front.jpg",
                licenseBack: "https://example.com/docs/license-rajesh-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-rajesh-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-rajesh-back.jpg",
                panCardImage: "https://example.com/docs/pan-rajesh.jpg",
                livePhoto: "https://example.com/photos/rajesh-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-rajesh.jpg",

                // KYC & Status
                kycStatus: "APPROVED",
                status: "ACTIVE",
                isAvailable: true,

                // Fleet Association
                fleetId: fleet.id
            },
            create: {
                userId: user.id,
                fleetId: fleet.id,

                // Personal Details
                firstName: "Rajesh",
                lastName: "Kumar",
                mobile: "9876543210",
                licenseNumber: "DL-0120230012345",

                // Document Images
                profilePic: "https://example.com/photos/rajesh-kumar.jpg",
                licenseFront: "https://example.com/docs/license-rajesh-front.jpg",
                licenseBack: "https://example.com/docs/license-rajesh-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-rajesh-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-rajesh-back.jpg",
                panCardImage: "https://example.com/docs/pan-rajesh.jpg",
                livePhoto: "https://example.com/photos/rajesh-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-rajesh.jpg",

                // KYC & Status
                kycStatus: "APPROVED",
                status: "ACTIVE",
                isAvailable: true
            }
        });
        console.log(`✅ Driver profile created: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})\n`);

        // 4. Create Vehicle (Optional)
        console.log("4️⃣ Creating Vehicle...");
        const vehicle = await prisma.vehicle.upsert({
            where: { vehicleNumber: "DL01AB1234" },
            update: {},
            create: {
                fleetId: fleet.id,
                vehicleNumber: "DL01AB1234",
                vehicleName: "Tata Tigor EV",
                vehicleModel: "Tigor EV 2024",
                vehicleColor: "White",
                fuelType: FuelType.ELECTRIC,
                ownership: VehicleOwnership.OWNED,
                status: VehicleStatus.ACTIVE,
                rcFrontImage: "https://example.com/docs/rc-front.jpg",
                rcBackImage: "https://example.com/docs/rc-back.jpg",
                permitImage: "https://example.com/docs/permit.jpg",
                permitExpiry: new Date("2034-12-31"),
                fitnessImage: "https://example.com/docs/fitness.jpg",
                fitnessExpiry: new Date("2026-12-31"),
                insuranceImage: "https://example.com/docs/insurance.jpg",
                insuranceExpiry: new Date("2025-12-31")
            }
        });
        console.log(`✅ Vehicle created: ${vehicle.vehicleNumber} (ID: ${vehicle.id})\n`);

        // 5. Create Assignment (Driver + Vehicle)
        console.log("5️⃣ Creating Assignment...");
        const assignment = await prisma.assignment.create({
            data: {
                fleetId: fleet.id,
                driverId: driver.id,
                vehicleId: vehicle.id,
                status: "ACTIVE"
            }
        });
        console.log(`✅ Assignment created (ID: ${assignment.id})\n`);

        // Summary
        console.log("═══════════════════════════════════════");
        console.log("✅ COMPLETE DRIVER PROFILE CREATED!");
        console.log("═══════════════════════════════════════\n");

        console.log("📋 Summary:");
        console.log(`   Fleet: ${fleet.name}`);
        console.log(`   Driver: ${driver.firstName} ${driver.lastName}`);
        console.log(`   Phone: ${driver.mobile}`);
        console.log(`   License: ${driver.licenseNumber}`);
        console.log(`   KYC Status: ${driver.kycStatus}`);
        console.log(`   Vehicle: ${vehicle.vehicleNumber}`);
        console.log(`   Status: ${driver.status}\n`);

        console.log("🔐 Login Credentials:");
        console.log(`   Phone: ${user.phone}`);
        console.log(`   OTP (Dev): 000000\n`);

        console.log("✅ Driver is ready to use!");

    } catch (error) {
        console.error("❌ Error creating driver:", error);
        throw error;
    } finally {
        await pool.end();
        await prisma.$disconnect();
    }
}

// Run the script
createCompleteDriver()
    .then(() => {
        console.log("\n✅ Script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Script failed:", error);
        process.exit(1);
    });

import { PrismaClient, UserRole, FleetType, VehicleStatus, FuelType, VehicleOwnership, TripType, TripStatus, AssignmentStatus, KycStatus, DriverStatus } from "@prisma/client";
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

async function seedCompleteDatabase() {
    console.log("🚀 Starting Complete Database Seeding...\n");
    console.log("═══════════════════════════════════════════════════════════\n");

    try {
        // ========================================
        // 1. CREATE FLEETS
        // ========================================
        console.log("1️⃣ Creating Fleets...");

        const fleet1 = await prisma.fleet.upsert({
            where: { mobile: "9876543210" },
            update: {},
            create: {
                name: "Prime Cabs Pvt Ltd",
                city: "GURGAON",
                mobile: "9876543210",
                email: "contact@primecabs.com",
                panNumber: "ABCDE1234F",
                gstNumber: "29ABCDE1234F1Z5",
                modeId: "CAB",
                fleetType: FleetType.COMPANY,
                status: "ACTIVE"
            }
        });
        console.log(`   ✅ Fleet 1: ${fleet1.name} (ID: ${fleet1.id})`);

        const fleet2 = await prisma.fleet.upsert({
            where: { mobile: "9876543211" },
            update: {},
            create: {
                name: "Metro Rides Services",
                city: "DELHI",
                mobile: "9876543211",
                email: "info@metrorides.com",
                panNumber: "FGHIJ5678K",
                gstNumber: "07FGHIJ5678K1Z8",
                modeId: "CAB",
                fleetType: FleetType.COMPANY,
                status: "ACTIVE"
            }
        });
        console.log(`   ✅ Fleet 2: ${fleet2.name} (ID: ${fleet2.id})`);

        const fleet3 = await prisma.fleet.upsert({
            where: { mobile: "9876543212" },
            update: {},
            create: {
                name: "Express Travels",
                city: "NOIDA",
                mobile: "9876543212",
                email: "support@expresstravels.com",
                panNumber: "LMNOP9012Q",
                modeId: "CAB",
                fleetType: FleetType.INDIVIDUAL,
                status: "ACTIVE"
            }
        });
        console.log(`   ✅ Fleet 3: ${fleet3.name} (ID: ${fleet3.id})\n`);

        // ========================================
        // 2. CREATE VEHICLES
        // ========================================
        console.log("2️⃣ Creating Vehicles...");

        const vehicle1 = await prisma.vehicle.upsert({
            where: { vehicleNumber: "DL01AB1234" },
            update: {},
            create: {
                fleetId: fleet1.id,
                vehicleNumber: "DL01AB1234",
                vehicleName: "Tata Tigor EV",
                vehicleModel: "Tigor EV 2024",
                vehicleColor: "White",
                fuelType: FuelType.ELECTRIC,
                ownership: VehicleOwnership.OWNED,
                status: VehicleStatus.ACTIVE,
                rcFrontImage: "https://example.com/docs/rc-front-1.jpg",
                rcBackImage: "https://example.com/docs/rc-back-1.jpg",
                permitImage: "https://example.com/docs/permit-1.jpg",
                permitExpiry: new Date("2034-12-31"),
                fitnessImage: "https://example.com/docs/fitness-1.jpg",
                fitnessExpiry: new Date("2026-12-31"),
                insuranceImage: "https://example.com/docs/insurance-1.jpg",
                insuranceExpiry: new Date("2025-12-31")
            }
        });
        console.log(`   ✅ Vehicle 1: ${vehicle1.vehicleNumber} - ${vehicle1.vehicleName}`);

        const vehicle2 = await prisma.vehicle.upsert({
            where: { vehicleNumber: "DL02CD5678" },
            update: {},
            create: {
                fleetId: fleet1.id,
                vehicleNumber: "DL02CD5678",
                vehicleName: "Maruti Dzire",
                vehicleModel: "Dzire VXI 2023",
                vehicleColor: "Silver",
                fuelType: FuelType.CNG,
                ownership: VehicleOwnership.OWNED,
                status: VehicleStatus.ACTIVE,
                rcFrontImage: "https://example.com/docs/rc-front-2.jpg",
                rcBackImage: "https://example.com/docs/rc-back-2.jpg",
                permitImage: "https://example.com/docs/permit-2.jpg",
                permitExpiry: new Date("2033-06-30"),
                fitnessImage: "https://example.com/docs/fitness-2.jpg",
                fitnessExpiry: new Date("2026-06-30"),
                insuranceImage: "https://example.com/docs/insurance-2.jpg",
                insuranceExpiry: new Date("2025-06-30")
            }
        });
        console.log(`   ✅ Vehicle 2: ${vehicle2.vehicleNumber} - ${vehicle2.vehicleName}`);

        const vehicle3 = await prisma.vehicle.upsert({
            where: { vehicleNumber: "DL03EF9012" },
            update: {},
            create: {
                fleetId: fleet2.id,
                vehicleNumber: "DL03EF9012",
                vehicleName: "Honda City",
                vehicleModel: "City ZX 2024",
                vehicleColor: "Black",
                fuelType: FuelType.PETROL,
                ownership: VehicleOwnership.LEASED,
                status: VehicleStatus.ACTIVE,
                rcFrontImage: "https://example.com/docs/rc-front-3.jpg",
                rcBackImage: "https://example.com/docs/rc-back-3.jpg",
                permitImage: "https://example.com/docs/permit-3.jpg",
                permitExpiry: new Date("2034-03-31"),
                fitnessImage: "https://example.com/docs/fitness-3.jpg",
                fitnessExpiry: new Date("2027-03-31"),
                insuranceImage: "https://example.com/docs/insurance-3.jpg",
                insuranceExpiry: new Date("2025-09-30")
            }
        });
        console.log(`   ✅ Vehicle 3: ${vehicle3.vehicleNumber} - ${vehicle3.vehicleName}`);

        const vehicle4 = await prisma.vehicle.upsert({
            where: { vehicleNumber: "DL04GH3456" },
            update: {},
            create: {
                fleetId: fleet2.id,
                vehicleNumber: "DL04GH3456",
                vehicleName: "Hyundai Aura",
                vehicleModel: "Aura SX 2023",
                vehicleColor: "Blue",
                fuelType: FuelType.DIESEL,
                ownership: VehicleOwnership.OWNED,
                status: VehicleStatus.ACTIVE,
                rcFrontImage: "https://example.com/docs/rc-front-4.jpg",
                rcBackImage: "https://example.com/docs/rc-back-4.jpg",
                permitImage: "https://example.com/docs/permit-4.jpg",
                permitExpiry: new Date("2033-12-31"),
                fitnessImage: "https://example.com/docs/fitness-4.jpg",
                fitnessExpiry: new Date("2026-12-31"),
                insuranceImage: "https://example.com/docs/insurance-4.jpg",
                insuranceExpiry: new Date("2025-12-31")
            }
        });
        console.log(`   ✅ Vehicle 4: ${vehicle4.vehicleNumber} - ${vehicle4.vehicleName}`);

        const vehicle5 = await prisma.vehicle.upsert({
            where: { vehicleNumber: "DL05IJ7890" },
            update: {},
            create: {
                fleetId: fleet3.id,
                vehicleNumber: "DL05IJ7890",
                vehicleName: "Toyota Innova",
                vehicleModel: "Innova Crysta 2024",
                vehicleColor: "Grey",
                fuelType: FuelType.DIESEL,
                ownership: VehicleOwnership.OWNED,
                status: VehicleStatus.ACTIVE,
                rcFrontImage: "https://example.com/docs/rc-front-5.jpg",
                rcBackImage: "https://example.com/docs/rc-back-5.jpg",
                permitImage: "https://example.com/docs/permit-5.jpg",
                permitExpiry: new Date("2034-06-30"),
                fitnessImage: "https://example.com/docs/fitness-5.jpg",
                fitnessExpiry: new Date("2027-06-30"),
                insuranceImage: "https://example.com/docs/insurance-5.jpg",
                insuranceExpiry: new Date("2025-11-30")
            }
        });
        console.log(`   ✅ Vehicle 5: ${vehicle5.vehicleNumber} - ${vehicle5.vehicleName}\n`);

        // ========================================
        // 3. CREATE DRIVERS (with Users)
        // ========================================
        console.log("3️⃣ Creating Drivers...");

        // Driver 1 - Fleet 1
        const user1 = await prisma.user.upsert({
            where: { phone: "9123456780" },
            update: {},
            create: {
                name: "Rajesh Kumar",
                phone: "9123456780",
                role: UserRole.DRIVER,
                isActive: true
            }
        });

        const driver1 = await prisma.driver.upsert({
            where: { userId: user1.id },
            update: {
                firstName: "Rajesh",
                lastName: "Kumar",
                mobile: "9123456780",
                licenseNumber: "DL-0120230012345",
                profilePic: "https://example.com/photos/rajesh-kumar.jpg",
                licenseFront: "https://example.com/docs/license-rajesh-front.jpg",
                licenseBack: "https://example.com/docs/license-rajesh-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-rajesh-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-rajesh-back.jpg",
                panCardImage: "https://example.com/docs/pan-rajesh.jpg",
                livePhoto: "https://example.com/photos/rajesh-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-rajesh.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true,
                fleetId: fleet1.id
            },
            create: {
                userId: user1.id,
                fleetId: fleet1.id,
                firstName: "Rajesh",
                lastName: "Kumar",
                mobile: "9123456780",
                licenseNumber: "DL-0120230012345",
                profilePic: "https://example.com/photos/rajesh-kumar.jpg",
                licenseFront: "https://example.com/docs/license-rajesh-front.jpg",
                licenseBack: "https://example.com/docs/license-rajesh-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-rajesh-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-rajesh-back.jpg",
                panCardImage: "https://example.com/docs/pan-rajesh.jpg",
                livePhoto: "https://example.com/photos/rajesh-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-rajesh.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true
            }
        });
        console.log(`   ✅ Driver 1: ${driver1.firstName} ${driver1.lastName} (${fleet1.name})`);

        // Driver 2 - Fleet 1
        const user2 = await prisma.user.upsert({
            where: { phone: "9123456781" },
            update: {},
            create: {
                name: "Amit Singh",
                phone: "9123456781",
                role: UserRole.DRIVER,
                isActive: true
            }
        });

        const driver2 = await prisma.driver.upsert({
            where: { userId: user2.id },
            update: {
                firstName: "Amit",
                lastName: "Singh",
                mobile: "9123456781",
                licenseNumber: "DL-0120230012346",
                profilePic: "https://example.com/photos/amit-singh.jpg",
                licenseFront: "https://example.com/docs/license-amit-front.jpg",
                licenseBack: "https://example.com/docs/license-amit-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-amit-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-amit-back.jpg",
                panCardImage: "https://example.com/docs/pan-amit.jpg",
                livePhoto: "https://example.com/photos/amit-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-amit.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true,
                fleetId: fleet1.id
            },
            create: {
                userId: user2.id,
                fleetId: fleet1.id,
                firstName: "Amit",
                lastName: "Singh",
                mobile: "9123456781",
                licenseNumber: "DL-0120230012346",
                profilePic: "https://example.com/photos/amit-singh.jpg",
                licenseFront: "https://example.com/docs/license-amit-front.jpg",
                licenseBack: "https://example.com/docs/license-amit-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-amit-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-amit-back.jpg",
                panCardImage: "https://example.com/docs/pan-amit.jpg",
                livePhoto: "https://example.com/photos/amit-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-amit.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true
            }
        });
        console.log(`   ✅ Driver 2: ${driver2.firstName} ${driver2.lastName} (${fleet1.name})`);

        // Driver 3 - Fleet 2
        const user3 = await prisma.user.upsert({
            where: { phone: "9123456782" },
            update: {},
            create: {
                name: "Suresh Sharma",
                phone: "9123456782",
                role: UserRole.DRIVER,
                isActive: true
            }
        });

        const driver3 = await prisma.driver.upsert({
            where: { userId: user3.id },
            update: {
                firstName: "Suresh",
                lastName: "Sharma",
                mobile: "9123456782",
                licenseNumber: "DL-0720230012347",
                profilePic: "https://example.com/photos/suresh-sharma.jpg",
                licenseFront: "https://example.com/docs/license-suresh-front.jpg",
                licenseBack: "https://example.com/docs/license-suresh-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-suresh-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-suresh-back.jpg",
                panCardImage: "https://example.com/docs/pan-suresh.jpg",
                livePhoto: "https://example.com/photos/suresh-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-suresh.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true,
                fleetId: fleet2.id
            },
            create: {
                userId: user3.id,
                fleetId: fleet2.id,
                firstName: "Suresh",
                lastName: "Sharma",
                mobile: "9123456782",
                licenseNumber: "DL-0720230012347",
                profilePic: "https://example.com/photos/suresh-sharma.jpg",
                licenseFront: "https://example.com/docs/license-suresh-front.jpg",
                licenseBack: "https://example.com/docs/license-suresh-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-suresh-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-suresh-back.jpg",
                panCardImage: "https://example.com/docs/pan-suresh.jpg",
                livePhoto: "https://example.com/photos/suresh-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-suresh.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true
            }
        });
        console.log(`   ✅ Driver 3: ${driver3.firstName} ${driver3.lastName} (${fleet2.name})`);

        // Driver 4 - Fleet 2
        const user4 = await prisma.user.upsert({
            where: { phone: "9123456783" },
            update: {},
            create: {
                name: "Vikram Yadav",
                phone: "9123456783",
                role: UserRole.DRIVER,
                isActive: true
            }
        });

        const driver4 = await prisma.driver.upsert({
            where: { userId: user4.id },
            update: {
                firstName: "Vikram",
                lastName: "Yadav",
                mobile: "9123456783",
                licenseNumber: "DL-0720230012348",
                profilePic: "https://example.com/photos/vikram-yadav.jpg",
                licenseFront: "https://example.com/docs/license-vikram-front.jpg",
                licenseBack: "https://example.com/docs/license-vikram-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-vikram-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-vikram-back.jpg",
                panCardImage: "https://example.com/docs/pan-vikram.jpg",
                livePhoto: "https://example.com/photos/vikram-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-vikram.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true,
                fleetId: fleet2.id
            },
            create: {
                userId: user4.id,
                fleetId: fleet2.id,
                firstName: "Vikram",
                lastName: "Yadav",
                mobile: "9123456783",
                licenseNumber: "DL-0720230012348",
                profilePic: "https://example.com/photos/vikram-yadav.jpg",
                licenseFront: "https://example.com/docs/license-vikram-front.jpg",
                licenseBack: "https://example.com/docs/license-vikram-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-vikram-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-vikram-back.jpg",
                panCardImage: "https://example.com/docs/pan-vikram.jpg",
                livePhoto: "https://example.com/photos/vikram-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-vikram.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true
            }
        });
        console.log(`   ✅ Driver 4: ${driver4.firstName} ${driver4.lastName} (${fleet2.name})`);

        // Driver 5 - Fleet 3
        const user5 = await prisma.user.upsert({
            where: { phone: "9123456784" },
            update: {},
            create: {
                name: "Manoj Verma",
                phone: "9123456784",
                role: UserRole.DRIVER,
                isActive: true
            }
        });

        const driver5 = await prisma.driver.upsert({
            where: { userId: user5.id },
            update: {
                firstName: "Manoj",
                lastName: "Verma",
                mobile: "9123456784",
                licenseNumber: "UP-1420230012349",
                profilePic: "https://example.com/photos/manoj-verma.jpg",
                licenseFront: "https://example.com/docs/license-manoj-front.jpg",
                licenseBack: "https://example.com/docs/license-manoj-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-manoj-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-manoj-back.jpg",
                panCardImage: "https://example.com/docs/pan-manoj.jpg",
                livePhoto: "https://example.com/photos/manoj-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-manoj.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true,
                fleetId: fleet3.id
            },
            create: {
                userId: user5.id,
                fleetId: fleet3.id,
                firstName: "Manoj",
                lastName: "Verma",
                mobile: "9123456784",
                licenseNumber: "UP-1420230012349",
                profilePic: "https://example.com/photos/manoj-verma.jpg",
                licenseFront: "https://example.com/docs/license-manoj-front.jpg",
                licenseBack: "https://example.com/docs/license-manoj-back.jpg",
                aadharFront: "https://example.com/docs/aadhaar-manoj-front.jpg",
                aadharBack: "https://example.com/docs/aadhaar-manoj-back.jpg",
                panCardImage: "https://example.com/docs/pan-manoj.jpg",
                livePhoto: "https://example.com/photos/manoj-live.jpg",
                bankIdProof: "https://example.com/docs/bank-proof-manoj.jpg",
                kycStatus: KycStatus.APPROVED,
                status: DriverStatus.ACTIVE,
                isAvailable: true
            }
        });
        console.log(`   ✅ Driver 5: ${driver5.firstName} ${driver5.lastName} (${fleet3.name})\n`);

        // ========================================
        // 4. CREATE ASSIGNMENTS (Driver + Vehicle)
        // ========================================
        console.log("4️⃣ Creating Assignments (Driver-Vehicle)...");

        const assignment1 = await prisma.assignment.create({
            data: {
                fleetId: fleet1.id,
                driverId: driver1.id,
                vehicleId: vehicle1.id,
                status: AssignmentStatus.ACTIVE
            }
        });
        console.log(`   ✅ Assignment 1: ${driver1.firstName} ${driver1.lastName} ↔ ${vehicle1.vehicleNumber}`);

        const assignment2 = await prisma.assignment.create({
            data: {
                fleetId: fleet1.id,
                driverId: driver2.id,
                vehicleId: vehicle2.id,
                status: AssignmentStatus.ACTIVE
            }
        });
        console.log(`   ✅ Assignment 2: ${driver2.firstName} ${driver2.lastName} ↔ ${vehicle2.vehicleNumber}`);

        const assignment3 = await prisma.assignment.create({
            data: {
                fleetId: fleet2.id,
                driverId: driver3.id,
                vehicleId: vehicle3.id,
                status: AssignmentStatus.ACTIVE
            }
        });
        console.log(`   ✅ Assignment 3: ${driver3.firstName} ${driver3.lastName} ↔ ${vehicle3.vehicleNumber}`);

        const assignment4 = await prisma.assignment.create({
            data: {
                fleetId: fleet2.id,
                driverId: driver4.id,
                vehicleId: vehicle4.id,
                status: AssignmentStatus.ACTIVE
            }
        });
        console.log(`   ✅ Assignment 4: ${driver4.firstName} ${driver4.lastName} ↔ ${vehicle4.vehicleNumber}`);

        const assignment5 = await prisma.assignment.create({
            data: {
                fleetId: fleet3.id,
                driverId: driver5.id,
                vehicleId: vehicle5.id,
                status: AssignmentStatus.ACTIVE
            }
        });
        console.log(`   ✅ Assignment 5: ${driver5.firstName} ${driver5.lastName} ↔ ${vehicle5.vehicleNumber}\n`);

        // ========================================
        // 5. CREATE TRIPS
        // ========================================
        console.log("5️⃣ Creating Trips...");

        // Trip 1 - Airport Trip (Completed)
        const trip1 = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: "GURGAON",
                destinationCity: "DELHI",
                pickupLocation: "Cyber City, Gurgaon",
                dropLocation: "IGI Airport Terminal 3, Delhi",
                pickupLat: 28.4950,
                pickupLng: 77.0826,
                dropLat: 28.5562,
                dropLng: 77.1000,
                pickupTime: new Date("2025-12-20T06:00:00Z"),
                startedAt: new Date("2025-12-20T06:05:00Z"),
                completedAt: new Date("2025-12-20T07:15:00Z"),
                distanceKm: 18.5,
                billableKm: 19,
                ratePerKm: 15,
                price: 285,
                vehicleSku: "SEDAN",
                status: TripStatus.COMPLETED
            }
        });
        console.log(`   ✅ Trip 1: ${trip1.tripType} - ${trip1.originCity} to ${trip1.destinationCity} (${trip1.status})`);

        // Create trip assignment for trip 1
        await prisma.tripAssignment.create({
            data: {
                tripId: trip1.id,
                driverId: driver1.id,
                status: AssignmentStatus.COMPLETED
            }
        });

        // Trip 2 - Inter-City Trip (Started)
        const trip2 = await prisma.ride.create({
            data: {
                tripType: TripType.INTER_CITY,
                originCity: "DELHI",
                destinationCity: "JAIPUR",
                pickupLocation: "Connaught Place, Delhi",
                dropLocation: "Jaipur Railway Station",
                pickupLat: 28.6315,
                pickupLng: 77.2167,
                dropLat: 26.9124,
                dropLng: 75.7873,
                pickupTime: new Date("2025-12-24T08:00:00Z"),
                startedAt: new Date("2025-12-24T08:10:00Z"),
                distanceKm: 280,
                billableKm: 280,
                ratePerKm: 12,
                price: 3360,
                vehicleSku: "SEDAN",
                status: TripStatus.STARTED
            }
        });
        console.log(`   ✅ Trip 2: ${trip2.tripType} - ${trip2.originCity} to ${trip2.destinationCity} (${trip2.status})`);

        // Create trip assignment for trip 2
        await prisma.tripAssignment.create({
            data: {
                tripId: trip2.id,
                driverId: driver3.id,
                status: AssignmentStatus.ASSIGNED
            }
        });

        // Trip 3 - Rental Trip (Completed)
        const trip3 = await prisma.ride.create({
            data: {
                tripType: TripType.RENTAL,
                originCity: "GURGAON",
                destinationCity: "GURGAON",
                pickupLocation: "DLF Phase 3, Gurgaon",
                dropLocation: "DLF Phase 3, Gurgaon",
                pickupLat: 28.4950,
                pickupLng: 77.0826,
                dropLat: 28.4950,
                dropLng: 77.0826,
                pickupTime: new Date("2025-12-22T10:00:00Z"),
                startedAt: new Date("2025-12-22T10:05:00Z"),
                completedAt: new Date("2025-12-22T18:30:00Z"),
                distanceKm: 85,
                billableKm: 85,
                ratePerKm: 10,
                price: 850,
                vehicleSku: "HATCHBACK",
                status: TripStatus.COMPLETED
            }
        });
        console.log(`   ✅ Trip 3: ${trip3.tripType} - ${trip3.originCity} (${trip3.status})`);

        // Create trip assignment for trip 3
        await prisma.tripAssignment.create({
            data: {
                tripId: trip3.id,
                driverId: driver2.id,
                status: AssignmentStatus.COMPLETED
            }
        });

        // Trip 4 - Airport Trip (Driver Assigned)
        const trip4 = await prisma.ride.create({
            data: {
                tripType: TripType.AIRPORT,
                originCity: "NOIDA",
                destinationCity: "DELHI",
                pickupLocation: "Sector 62, Noida",
                dropLocation: "IGI Airport Terminal 2, Delhi",
                pickupLat: 28.6271,
                pickupLng: 77.3716,
                dropLat: 28.5562,
                dropLng: 77.1000,
                pickupTime: new Date("2025-12-25T05:30:00Z"),
                distanceKm: 25,
                billableKm: 25,
                ratePerKm: 15,
                price: 375,
                vehicleSku: "SUV",
                status: TripStatus.DRIVER_ASSIGNED
            }
        });
        console.log(`   ✅ Trip 4: ${trip4.tripType} - ${trip4.originCity} to ${trip4.destinationCity} (${trip4.status})`);

        // Create trip assignment for trip 4
        await prisma.tripAssignment.create({
            data: {
                tripId: trip4.id,
                driverId: driver5.id,
                status: AssignmentStatus.ASSIGNED
            }
        });

        // Trip 5 - Inter-City Trip (Created - Pending Assignment)
        const trip5 = await prisma.ride.create({
            data: {
                tripType: TripType.INTER_CITY,
                originCity: "GURGAON",
                destinationCity: "AGRA",
                pickupLocation: "Sector 29, Gurgaon",
                dropLocation: "Taj Mahal, Agra",
                pickupLat: 28.4595,
                pickupLng: 77.0266,
                dropLat: 27.1751,
                dropLng: 78.0421,
                pickupTime: new Date("2025-12-26T06:00:00Z"),
                distanceKm: 240,
                billableKm: 240,
                ratePerKm: 12,
                price: 2880,
                vehicleSku: "SEDAN",
                status: TripStatus.CREATED
            }
        });
        console.log(`   ✅ Trip 5: ${trip5.tripType} - ${trip5.originCity} to ${trip5.destinationCity} (${trip5.status})`);

        // Trip 6 - Rental Trip (Cancelled)
        const trip6 = await prisma.ride.create({
            data: {
                tripType: TripType.RENTAL,
                originCity: "DELHI",
                destinationCity: "DELHI",
                pickupLocation: "Karol Bagh, Delhi",
                dropLocation: "Karol Bagh, Delhi",
                pickupLat: 28.6519,
                pickupLng: 77.1909,
                dropLat: 28.6519,
                dropLng: 77.1909,
                pickupTime: new Date("2025-12-23T09:00:00Z"),
                distanceKm: 0,
                billableKm: 0,
                ratePerKm: 10,
                price: 0,
                vehicleSku: "HATCHBACK",
                status: TripStatus.CANCELLED
            }
        });
        console.log(`   ✅ Trip 6: ${trip6.tripType} - ${trip6.originCity} (${trip6.status})`);

        // Create trip assignment for trip 6
        await prisma.tripAssignment.create({
            data: {
                tripId: trip6.id,
                driverId: driver4.id,
                status: AssignmentStatus.CANCELLED
            }
        });

        console.log("\n═══════════════════════════════════════════════════════════");
        console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
        console.log("═══════════════════════════════════════════════════════════\n");

        // ========================================
        // SUMMARY
        // ========================================
        console.log("📊 SEEDING SUMMARY:\n");
        console.log("┌─────────────────────────────────────────────────────────┐");
        console.log("│ FLEETS                                                  │");
        console.log("├─────────────────────────────────────────────────────────┤");
        console.log(`│ • ${fleet1.name.padEnd(40)} │`);
        console.log(`│   📞 ${fleet1.mobile} | 📍 ${fleet1.city.padEnd(20)} │`);
        console.log(`│ • ${fleet2.name.padEnd(40)} │`);
        console.log(`│   📞 ${fleet2.mobile} | 📍 ${fleet2.city.padEnd(20)} │`);
        console.log(`│ • ${fleet3.name.padEnd(40)} │`);
        console.log(`│   📞 ${fleet3.mobile} | 📍 ${fleet3.city.padEnd(20)} │`);
        console.log("└─────────────────────────────────────────────────────────┘\n");

        console.log("┌─────────────────────────────────────────────────────────┐");
        console.log("│ VEHICLES                                                │");
        console.log("├─────────────────────────────────────────────────────────┤");
        console.log(`│ • ${vehicle1.vehicleNumber} - ${vehicle1.vehicleName.padEnd(30)} │`);
        console.log(`│ • ${vehicle2.vehicleNumber} - ${vehicle2.vehicleName.padEnd(30)} │`);
        console.log(`│ • ${vehicle3.vehicleNumber} - ${vehicle3.vehicleName.padEnd(30)} │`);
        console.log(`│ • ${vehicle4.vehicleNumber} - ${vehicle4.vehicleName.padEnd(30)} │`);
        console.log(`│ • ${vehicle5.vehicleNumber} - ${vehicle5.vehicleName.padEnd(30)} │`);
        console.log("└─────────────────────────────────────────────────────────┘\n");

        console.log("┌─────────────────────────────────────────────────────────┐");
        console.log("│ DRIVERS                                                 │");
        console.log("├─────────────────────────────────────────────────────────┤");
        console.log(`│ • ${driver1.firstName} ${driver1.lastName.padEnd(15)} | 📞 ${driver1.mobile} │`);
        console.log(`│ • ${driver2.firstName} ${driver2.lastName.padEnd(15)} | 📞 ${driver2.mobile} │`);
        console.log(`│ • ${driver3.firstName} ${driver3.lastName.padEnd(15)} | 📞 ${driver3.mobile} │`);
        console.log(`│ • ${driver4.firstName} ${driver4.lastName.padEnd(15)} | 📞 ${driver4.mobile} │`);
        console.log(`│ • ${driver5.firstName} ${driver5.lastName.padEnd(15)} | 📞 ${driver5.mobile} │`);
        console.log("└─────────────────────────────────────────────────────────┘\n");

        console.log("┌─────────────────────────────────────────────────────────┐");
        console.log("│ TRIPS                                                   │");
        console.log("├─────────────────────────────────────────────────────────┤");
        console.log(`│ • Trip 1: ${trip1.tripType.padEnd(10)} | ${trip1.status.padEnd(20)} │`);
        console.log(`│ • Trip 2: ${trip2.tripType.padEnd(10)} | ${trip2.status.padEnd(20)} │`);
        console.log(`│ • Trip 3: ${trip3.tripType.padEnd(10)} | ${trip3.status.padEnd(20)} │`);
        console.log(`│ • Trip 4: ${trip4.tripType.padEnd(10)} | ${trip4.status.padEnd(20)} │`);
        console.log(`│ • Trip 5: ${trip5.tripType.padEnd(10)} | ${trip5.status.padEnd(20)} │`);
        console.log(`│ • Trip 6: ${trip6.tripType.padEnd(10)} | ${trip6.status.padEnd(20)} │`);
        console.log("└─────────────────────────────────────────────────────────┘\n");

        console.log("🔐 LOGIN CREDENTIALS (All Drivers):");
        console.log("   • OTP (Dev Mode): 000000\n");

        console.log("✅ All entities created successfully!");
        console.log("✅ Relationships established!");
        console.log("✅ Ready for testing!\n");

    } catch (error) {
        console.error("❌ Error during seeding:", error);
        throw error;
    } finally {
        await pool.end();
        await prisma.$disconnect();
    }
}

// Run the script
seedCompleteDatabase()
    .then(() => {
        console.log("✅ Script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

import { prisma } from "./utils.js";
import { UserRole, FleetType, VehicleStatus, FuelType, VehicleOwnership, PaymentModel } from "@prisma/client";

// Constants
export const ADMIN_PHONE = "9999900001";
export const DRIVER_PHONE = "9999900002";
export const FLEET_NAME = "Test Fleet Inc.";
export const VEHICLE_NUMBER = "DL01TEST001";

export async function cleanup() {
    console.log("\n🧹 Cleaning up previous test data...");
    try {
        const phones = [ADMIN_PHONE, DRIVER_PHONE, "9870000000"];

        // 1. Delete Trip Assignments
        await prisma.tripAssignment.deleteMany({});

        // 2. Delete Rides
        await prisma.ride.deleteMany({});

        // 3. Delete Attendance/Breaks
        await prisma.break.deleteMany({});
        await prisma.attendance.deleteMany({});

        // 4. Delete Driver Transactions/Penalties/Rentals
        // Find user IDs first
        const users = await prisma.user.findMany({ where: { phone: { in: phones } }, include: { driver: true } });
        const driverIds = users.map(u => u.driver?.id).filter(Boolean) as string[];

        if (driverIds.length > 0) {
            await prisma.transaction.deleteMany({ where: { driverId: { in: driverIds } } });
            await prisma.penalty.deleteMany({ where: { driverId: { in: driverIds } } });
            await prisma.driverRental.deleteMany({ where: { driverId: { in: driverIds } } });
            await prisma.assignment.deleteMany({ where: { driverId: { in: driverIds } } });
            await prisma.driver.deleteMany({ where: { id: { in: driverIds } } });
        }

        // 5. Delete Vehicle
        await prisma.vehicle.deleteMany({ where: { vehicleNumber: VEHICLE_NUMBER } });

        // 6. Delete Fleet
        await prisma.fleet.deleteMany({ where: { name: FLEET_NAME } });

        // 7. Delete Users/OTPs
        await prisma.refreshToken.deleteMany({ where: { user: { phone: { in: phones } } } });
        await prisma.otp.deleteMany({ where: { phone: { in: phones } } });
        await prisma.user.deleteMany({ where: { phone: { in: phones } } });

        console.log("✅ Cleanup complete");
    } catch (error) {
        console.error("⚠️ Cleanup warning:", error);
    }
}

export async function seedData() {
    console.log("\n🌱 Seeding test data...");

    // Fleet
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

    // Admin
    await prisma.user.create({
        data: {
            name: "Test Admin",
            phone: ADMIN_PHONE,
            role: UserRole.SUPER_ADMIN,
            isActive: true
        }
    });

    // Driver User + Profile
    const driverUser = await prisma.user.create({
        data: {
            name: "Test Driver",
            phone: DRIVER_PHONE,
            role: UserRole.DRIVER,
            isActive: true,
            driver: {
                create: {
                    fleetId: fleet.id,
                    firstName: "Test",
                    lastName: "Driver",
                    mobile: DRIVER_PHONE,
                    licenseNumber: "DL1234567890",
                    kycStatus: "APPROVED",
                    status: "ACTIVE",
                    isAvailable: true,
                    paymentModel: PaymentModel.RENTAL,
                    depositBalance: 100
                }
            }
        }
    });

    const driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });

    // Vehicle
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

    // Assignment
    if (driver) {
        await prisma.assignment.create({
            data: {
                fleetId: fleet.id,
                driverId: driver.id,
                vehicleId: vehicle.id,
                status: "ACTIVE"
            }
        });
    }

    // Preference definitions (seed)
    const preferenceDefinitions = [
        { key: 'accept_rentals', displayName: 'Accept rentals', description: 'Allow rental rides', category: 'Trip', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'prefer_airport_rides', displayName: 'Prefer airport rides', description: 'Get airport rides first', category: 'Trip', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'auto_assign_rides', displayName: 'Auto assign rides', description: 'Auto assign rapido rides', category: 'Trip', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'prefer_short_trips', displayName: 'Prefer short trips', description: 'Prefer short distance rides', category: 'Trip', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'accept_outstation', displayName: 'Accept outstation', description: 'Allow outstation rides', category: 'Trip', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'enable_rental_model', displayName: 'Enable rental model', description: 'Enable rental payout', category: 'Payout', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'auto_deduct_loans', displayName: 'Auto deduct loans', description: 'Deduct loans automatically', category: 'Payout', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'auto_deduct_savings', displayName: 'Auto deduct savings', description: 'Deduct savings automatically', category: 'Payout', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'prefer_night_shift', displayName: 'Prefer night shift', description: 'Night shift preference', category: 'Shift', approvalRequired: true, defaultValue: false, isActive: true },
        { key: 'prefer_day_shift', displayName: 'Prefer day shift', description: 'Day shift preference', category: 'Shift', approvalRequired: true, defaultValue: false, isActive: true },
    ];

    await prisma.preferenceDefination.createMany({ data: preferenceDefinitions, skipDuplicates: true });

    console.log("✅ Seed data created");
    return { fleetId: fleet.id, driverId: driver?.id, vehicleId: vehicle.id };
}

// Standalone execution
if (process.argv[1] === import.meta.filename) {
    (async () => {
        await cleanup();
        await seedData();
        await prisma.$disconnect();
    })();
}

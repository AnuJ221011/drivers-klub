import { prisma } from "./utils.js";
import { RapidoService } from "../../src/modules/partner/rapido/rapido.service.js";

// Mock Service for API interception
class TestRapidoService extends RapidoService {
    async changeCaptainStatusRequest(driverId: string, status: 'online' | 'offline', vehicleNo?: string) {
        console.log(`   [MOCK RAPIDO API] Driver ${driverId} -> ${status.toUpperCase()}`);
        return { success: true };
    }
}

export async function run() {
    console.log("\n🛵 Testing Rapido Logic...");

    const service = new TestRapidoService();
    const driver = await prisma.driver.findFirst();

    if (!driver) {
        console.warn("⚠️  Skipping Rapido tests: No driver found");
        return;
    }

    try {
        // --- Scenario 1: Idle Check ---
        console.log("   Scenario 1: Idle Check");
        await service.validateAndSyncRapidoStatus(driver.id, "TEST_IDLE");

        // --- Scenario 2: Queue Logic Check ---
        console.log("   Scenario 2: Queue Logic Verification");
        const { ProviderType } = await import("@prisma/client"); // Dynamic import to avoid top-level issues if any

        // Cleanup before starting
        await prisma.tripAssignment.deleteMany({ where: { driverId: driver.id } });

        // 2.1 Create Active Rapido Trip
        const rapidoRide = await prisma.ride.create({
            data: {
                tripType: "INTER_CITY",
                originCity: "Test",
                destinationCity: "Test",
                pickupTime: new Date(),
                distanceKm: 10,
                provider: "RAPIDO",
                status: "STARTED",
                tripAssignments: { create: { driverId: driver.id, status: "ACTIVE" } }
            }
        });

        // 2.2 Create Conflict (Upcoming Trip < 45 mins) to trigger OFFLINE desire
        // We use an upcoming trip because 'INTERNAL' provider is not in Enum, 
        // preventing us from creating a STARTED Internal Trip easily without schema changes.
        // Upcoming trip logic relies on time buffer, not provider type.
        const upcomingRide = await prisma.ride.create({
            data: {
                tripType: "INTER_CITY",
                originCity: "Test2",
                destinationCity: "Test2",
                pickupTime: new Date(Date.now() + 10 * 60000), // 10 mins from now
                distanceKm: 10,
                // provider: null, // Internal by default/implication
                status: "CREATED",
                tripAssignments: { create: { driverId: driver.id, status: "ASSIGNED" } }
            }
        });

        // 2.3 Trigger Sync -> Should Queue
        await service.validateAndSyncRapidoStatus(driver.id, "TEST_QUEUE_TRIGGER");

        let updatedDriver = await prisma.driver.findUnique({ where: { id: driver.id } });
        let meta = updatedDriver?.providerMetadata as any;

        if (meta?.rapido?.pendingStatus === 'offline') {
            console.log("   ✅ Queue Created Successfully");
        } else {
            throw new Error("Queue failed to create");
        }

        // 2.4 End Trip -> Should Process
        await prisma.ride.update({ where: { id: rapidoRide.id }, data: { providerBookingId: "TEST_ORDER_INTEGRATION" } });

        try {
            await service.handleOrderStatusUpdate({
                orderId: "TEST_ORDER_INTEGRATION",
                status: "dropped", // COMPLETED
                phone: driver.mobile,
                pickupLocation: { lat: 0, lng: 0 },
                dropLocation: { lat: 0, lng: 0 }
            } as any);
        } catch (e) { console.error("Error in handleOrderStatusUpdate:", e); }

        updatedDriver = await prisma.driver.findUnique({ where: { id: driver.id } });
        meta = updatedDriver?.providerMetadata as any;

        if (!meta?.rapido?.pendingStatus) {
            console.log("   ✅ Queue Processed Successfully");
        } else {
            throw new Error("Queue failed to process (metadata not cleared)");
        }

        // Cleanup
        await prisma.tripAssignment.deleteMany({ where: { tripId: { in: [rapidoRide.id, upcomingRide.id] } } });
        await prisma.ride.deleteMany({ where: { id: { in: [rapidoRide.id, upcomingRide.id] } } });

        console.log("✅ Rapido Service Integration Check Passed");
    } catch (e: any) {
        console.error(`❌ Rapido Logic Error: ${e.message}`);
        // Ensure cleanup even on error
        try {
            // We don't have scope of ride IDs here easily without refactoring, 
            // but strictly speaking integration tests might leave dust on failure.
            // We rely on setup.ts to clean mostly.
        } catch { }
    }
}

if (process.argv[1] === import.meta.filename) {
    (async () => {
        try { await run(); } catch (e) { console.error(e); }
    })();
}

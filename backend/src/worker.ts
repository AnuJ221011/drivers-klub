import { prisma } from "./utils/prisma.js";
import { TripStatus } from "@prisma/client";
import { ProviderStatusSyncService } from "./core/trip/services/provider-status-sync.service.js";
import { RideProviderMappingRepository } from "./core/trip/repositories/ride-provider-mapping.repo.js";
import { RideService } from "./core/trip/services/ride.service.js";
import { ProviderRegistry } from "./core/trip/orchestrator/provider.registry.js";
import { InternalRideProvider } from "./adapters/providers/internal/internal.adapter.js";
import { MojoBoxxAdapter } from "./adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { ProviderType } from "./shared/enums/provider.enum.js";


// Setup dependencies for the worker
const registry = new ProviderRegistry();
registry.register(ProviderType.INTERNAL, new InternalRideProvider());
registry.register(ProviderType.MOJOBOXX, new MojoBoxxAdapter());

const mappingRepo = new RideProviderMappingRepository();
const rideService = new RideService();

const syncService = new ProviderStatusSyncService(mappingRepo, rideService, registry);

export function startStatusSyncWorker() {
    console.log("Starting Status Sync Worker...");

    // Run every 2 minutes
    setInterval(async () => {
        try {
            // Fetch active trips (rides)
            // Note: Model is Trip in DB, but domain uses Ride concepts. 
            // We filter by status where sync is needed.
            const activeTrips = await prisma.trip.findMany({
                where: {
                    status: {
                        in: [TripStatus.CREATED, TripStatus.STARTED],
                    },
                },
            });

            console.log(`[Sync Worker] Found ${activeTrips.length} active trips to sync.`);

            for (const trip of activeTrips) {
                await syncService.syncRide(trip.id);
            }
        } catch (error) {
            console.error("[Sync Worker] Error during sync cycle:", error);
        }
    }, 2 * 60 * 1000);
}

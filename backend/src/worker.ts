import { prisma } from "./utils/prisma.js";
import { ProviderStatusSyncService } from "./core/trip/services/provider-status-sync.service.js";
import { RideProviderMappingRepository } from "./core/trip/repositories/ride-provider-mapping.repo.js";
import { RideService } from "./core/trip/services/ride.service.js";
import { ProviderRegistry } from "./core/trip/orchestrator/provider.registry.js";
import { InternalRideProvider } from "./adapters/providers/internal/internal.adapter.js";
import { MojoBoxxAdapter } from "./adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { MMTAdapter } from "./adapters/providers/mmt/mmt.adapter.js";
import { ProviderType } from "./shared/enums/provider.enum.js";


// Setup dependencies for the worker
const registry = new ProviderRegistry();
registry.register(ProviderType.INTERNAL, new InternalRideProvider());
registry.register(ProviderType.MOJOBOXX, new MojoBoxxAdapter());
registry.register(ProviderType.MMT, new MMTAdapter());

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
            // Fetch active rides
            const activeRides = await prisma.ride.findMany({
                where: {
                    status: {
                        in: ["CREATED", "STARTED", "DRIVER_ASSIGNED"],
                    },
                },
            });

            console.log(`[Sync Worker] Found ${activeRides.length} active rides to sync.`);

            for (const ride of activeRides) {
                await syncService.syncRide(ride.id);
            }
        } catch (error: any) {
            if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED" || error?.cause?.code === "ENOTFOUND") {
                console.warn(`[Sync Worker] ⚠️  External Provider Unreachable (${error.hostname || "Unknown Host"}). skipping sync.`);
            } else {
                console.error("[Sync Worker] Error during sync cycle:", error);
            }
        }
    }, 2 * 60 * 1000);
}

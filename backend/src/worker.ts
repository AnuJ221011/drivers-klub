import { prisma } from "./utils/prisma.js";
import { ProviderStatusSyncService } from "./core/trip/services/provider-status-sync.service.js";
import { RideProviderMappingRepository } from "./core/trip/repositories/ride-provider-mapping.repo.js";
import { RideService } from "./core/trip/services/ride.service.js";
import { ProviderRegistry } from "./core/trip/orchestrator/provider.registry.js";
import { InternalRideProvider } from "./adapters/providers/internal/internal.adapter.js";
import { MojoBoxxAdapter } from "./adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { MMTAdapter } from "./adapters/providers/mmt/mmt.adapter.js";
import { ProviderType } from "./shared/enums/provider.enum.js";


const registry = new ProviderRegistry();
registry.register(ProviderType.INTERNAL, new InternalRideProvider());
registry.register(ProviderType.MOJOBOXX, new MojoBoxxAdapter());
registry.register(ProviderType.MMT, new MMTAdapter());

const mappingRepo = new RideProviderMappingRepository();
const rideService = new RideService();

const syncService = new ProviderStatusSyncService(mappingRepo, rideService, registry);

export function startStatusSyncWorker() {
    // Read configuration from environment variables
    const workerEnabled = process.env.WORKER_ENABLED !== 'false'; // Enabled by default
    const syncIntervalMs = parseInt(process.env.WORKER_SYNC_INTERVAL_MS || '300000', 10); // Default: 5 minutes

    if (!workerEnabled) {
        console.log("⏸️  Status Sync Worker is DISABLED (WORKER_ENABLED=false)");
        return;
    }

    console.log(`🚀 Starting Status Sync Worker (Interval: ${syncIntervalMs / 1000}s)...`);

    setInterval(async () => {
        try {

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
            // Handle database connection timeouts
            if (error?.code === "ETIMEDOUT") {
                console.warn(`[Sync Worker] ⚠️  Database connection timeout. Skipping sync cycle.`);
                return;
            }

            // Handle external provider errors
            if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED" || error?.cause?.code === "ENOTFOUND") {
                console.warn(`[Sync Worker] ⚠️  External Provider Unreachable (${error.hostname || "Unknown Host"}). Skipping sync.`);
            } else {
                console.error("[Sync Worker] Error during sync cycle:", error.message || error);
            }
        }
    }, syncIntervalMs);
}

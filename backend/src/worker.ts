import { prisma } from "./utils/prisma.js";
import { ProviderStatusSyncService } from "./core/trip/services/provider-status-sync.service.js";
import { RideProviderMappingRepository } from "./core/trip/repositories/ride-provider-mapping.repo.js";
import { RideService } from "./core/trip/services/ride.service.js";
import { ProviderRegistry } from "./core/trip/orchestrator/provider.registry.js";
import { InternalRideProvider } from "./adapters/providers/internal/internal.adapter.js";
import { MojoBoxxAdapter } from "./adapters/providers/mojoboxx/mojoboxx.adapter.js";
import { MMTAdapter } from "./adapters/providers/mmt/mmt.adapter.js";
import { ProviderType } from "./shared/enums/provider.enum.js";
import { RapidoService } from "./modules/partner/rapido/rapido.service.js";
import { logger } from "./utils/logger.js";


const registry = new ProviderRegistry();
registry.register(ProviderType.INTERNAL, new InternalRideProvider());
registry.register(ProviderType.MOJOBOXX, new MojoBoxxAdapter());
registry.register(ProviderType.MMT, new MMTAdapter());

const mappingRepo = new RideProviderMappingRepository();
const rideService = new RideService();

const syncService = new ProviderStatusSyncService(mappingRepo, rideService, registry);
const rapidoService = new RapidoService();

export function startStatusSyncWorker() {
    // Read configuration from environment variables
    const workerEnabled = process.env.WORKER_ENABLED !== 'false'; // Enabled by default
    const syncIntervalMs = parseInt(process.env.WORKER_SYNC_INTERVAL_MS || '300000', 10); // Default: 5 minutes

    if (!workerEnabled) {
        logger.info("⏸️  Status Sync Worker is DISABLED (WORKER_ENABLED=false)");
        return;
    }

    logger.info(`🚀 Starting Status Sync Worker (Interval: ${syncIntervalMs / 1000}s)...`);

    setInterval(async () => {
        try {

            const activeRides = await prisma.ride.findMany({
                where: {
                    status: {
                        in: ["CREATED", "STARTED", "DRIVER_ASSIGNED"],
                    },
                },
            });

            logger.info(`[Sync Worker] Found ${activeRides.length} active rides to sync.`);

            for (const ride of activeRides) {
                await syncService.syncRide(ride.id);
            }
        } catch (error: any) {
            // Handle database connection timeouts
            if (error?.code === "ETIMEDOUT") {
                logger.warn(`[Sync Worker] ⚠️  Database connection timeout. Skipping sync cycle.`);
                return;
            }

            // Handle external provider errors
            if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED" || error?.cause?.code === "ENOTFOUND") {
                logger.warn(`[Sync Worker] ⚠️  External Provider Unreachable (${error.hostname || "Unknown Host"}). Skipping sync.`);
            } else {
                logger.error("[Sync Worker] Error during sync cycle:", { error: error.message || error });
            }
        }
    }, syncIntervalMs);

    // ==========================================
    // RAPIDO STATUS SYNC WORKER (Every 5 mins)
    // ==========================================
    const rapidoSyncInterval = 5 * 60 * 1000;
    logger.info(`🚀 Starting Rapido Status Sync Worker (Interval: ${rapidoSyncInterval / 1000}s)...`);

    setInterval(async () => {
        try {
            const bufferMinutes = parseInt(process.env.RAPIDO_PRE_TRIP_BUFFER_MINUTES || '45', 10);
            const now = new Date();
            const bufferWindow = new Date(now.getTime() + bufferMinutes * 60 * 1000);

            // Find drivers who have assignments STARTING SOON (within buffer)
            // or are currently ACTIVE/ASSIGNED but might need status refresh.
            // We want to verify status for:
            // 1. Drivers with Assignments starting in [now, bufferWindow]
            // We can query TripAssignments where trip.pickupTime <= bufferWindow && trip.pickupTime > now

            const pendingAssignments = await prisma.tripAssignment.findMany({
                where: {
                    status: { in: ['ASSIGNED', 'DRIVER_ASSIGNED'] as any }, // Cast to any to avoid strict enum issues if any
                    trip: {
                        pickupTime: {
                            gte: now,
                            lte: bufferWindow
                        },
                        status: { notIn: ['CANCELLED', 'COMPLETED', 'CANCELLED_BY_PARTNER'] }
                    }
                },
                select: { driverId: true },
                distinct: ['driverId']
            });

            if (pendingAssignments.length > 0) {
                logger.info(`[Rapido Worker] Found ${pendingAssignments.length} drivers with upcoming trips. Checking status...`);
                for (const assignment of pendingAssignments) {
                    await rapidoService.validateAndSyncRapidoStatus(assignment.driverId, "WORKER_BUFFER_CHECK");
                }
            }

            // Retry Queue Processing
            await rapidoService.processRetryQueue();

        } catch (error: any) {
            logger.error(`[Rapido Worker] Error: ${error.message}`);
        }
    }, rapidoSyncInterval);
}

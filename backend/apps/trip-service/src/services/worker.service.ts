import { prisma } from "@driversklub/database";
import { RideSyncService } from "../core/provider/ride-sync.service.js";
import { logger } from "@driversklub/common";

/**
 * Background Worker Service
 * Periodically syncs provider ride status for active trips
 */
export class WorkerService {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    /**
     * Start the background worker
     */
    start() {
        const enabled = process.env.WORKER_ENABLED === 'true';

        if (!enabled) {
            logger.info('[Worker] Background worker is disabled (WORKER_ENABLED=false)');
            return;
        }

        const intervalMs = parseInt(process.env.WORKER_SYNC_INTERVAL_MS || '300000', 10);

        logger.info(`[Worker] Starting background worker (interval: ${intervalMs}ms = ${intervalMs / 60000} minutes)`);

        this.isRunning = true;

        // Run immediately on startup
        this.syncActiveTrips().catch(err => {
            logger.error('[Worker] Initial sync failed:', err);
        });

        // Then run periodically
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.syncActiveTrips();
            }
        }, intervalMs);
    }

    /**
     * Stop the background worker
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        logger.info('[Worker] Background worker stopped');
    }

    /**
     * Sync all active trips with provider status
     */
    private async syncActiveTrips() {
        try {
            logger.info('[Worker] Starting provider status sync...');

            // Find all active trips that have provider bookings
            const activeTrips = await prisma.ride.findMany({
                where: {
                    status: {
                        in: ['DRIVER_ASSIGNED', 'STARTED']
                    },
                    provider: {
                        not: null
                    },
                    providerBookingId: {
                        not: null
                    }
                },
                select: {
                    id: true,
                    provider: true,
                    providerBookingId: true,
                    status: true
                }
            });

            logger.info(`[Worker] Found ${activeTrips.length} active trips to sync`);

            let successCount = 0;
            let failCount = 0;

            // Sync each trip
            for (const trip of activeTrips) {
                try {
                    await RideSyncService.syncTrip(trip.id);
                    successCount++;
                } catch (error) {
                    failCount++;
                    logger.error(`[Worker] Failed to sync trip ${trip.id}:`, error);
                }
            }

            logger.info(`[Worker] Sync completed: ${successCount} success, ${failCount} failed`);
        } catch (error) {
            logger.error('[Worker] Failed to sync active trips:', error);
        }
    }

    /**
     * Get worker status
     */
    getStatus() {
        return {
            enabled: process.env.WORKER_ENABLED === 'true',
            running: this.isRunning,
            intervalMs: parseInt(process.env.WORKER_SYNC_INTERVAL_MS || '300000', 10)
        };
    }
}

// Export singleton instance
export const workerService = new WorkerService();

import { prisma } from "@driversklub/database";
// import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js";
enum AssignmentStatus {
    ASSIGNED = "ASSIGNED",
    ACTIVE = "ACTIVE",
    UNASSIGNED = "UNASSIGNED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED"
}
import { RapidoService } from "../../../modules/partner/rapido/rapido.service.js";
import { logger } from "@driversklub/common";

const rapidoService = new RapidoService();

export class TripCompleteService {
    static async completeTrip(tripId: string) {
        const trip = await prisma.ride.findFirst({
            where: { OR: [{ id: tripId }, { shortId: tripId }] },
            select: { id: true }
        });
        if (!trip) throw new Error('Trip not found');

        return prisma.$transaction(async (tx) => {
            // Update trip
            await tx.ride.update({
                where: { id: trip.id },
                data: { status: "COMPLETED" },
            });

            // Close assignment if exists
            const assignment = await tx.tripAssignment.findFirst({
                where: { tripId: trip.id, status: AssignmentStatus.ASSIGNED },
            });

            if (assignment) {
                await tx.tripAssignment.update({
                    where: { id: assignment.id },
                    data: {
                        status: AssignmentStatus.COMPLETED,
                    },
                });

                await tx.driver.update({
                    where: { id: assignment.driverId },
                    data: { isAvailable: true },
                });

                // Sync Rapido Status (Trip Completed -> potentially ONLINE)
                rapidoService.validateAndSyncRapidoStatus(assignment.driverId, "TRIP_COMPLETED").catch((error) => {
                    logger.error(`[TripCompleteService] Failed to sync Rapido status for driver ${assignment.driverId}:`, error);
                });
            }
        });
    }
}

import { prisma } from "@/utils/prisma.js";
import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js";
import { ProviderCancellationService } from "@/core/provider/provider-cancellation.service.js";

export class TripCancelService {
    static async cancelTrip(tripId: string) {
        return prisma.$transaction(async (tx) => {
            await tx.ride.update({
                where: { id: tripId },
                data: { status: "CANCELLED" },
            });

            const assignment = await tx.tripAssignment.findFirst({
                where: { tripId, status: AssignmentStatus.ASSIGNED },
            });

            if (assignment) {
                await tx.tripAssignment.update({
                    where: { id: assignment.id },
                    data: {
                        status: AssignmentStatus.CANCELLED,
                        unassignedAt: new Date(),
                    },
                });

                await tx.driver.update({
                    where: { id: assignment.driverId },
                    data: { isAvailable: true },
                });
            }
        });

        // 🔥 fire-and-forget provider cancellation
        ProviderCancellationService.cancelTripProviderBooking(tripId);
    }
}

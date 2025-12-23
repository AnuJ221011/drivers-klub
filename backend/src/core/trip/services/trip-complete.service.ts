import { prisma } from "@/utils/prisma.js";
import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js";

export class TripCompleteService {
    static async completeTrip(tripId: string) {
        return prisma.$transaction(async (tx) => {
            // Update trip
            await tx.ride.update({
                where: { id: tripId },
                data: { status: "COMPLETED" },
            });

            // Close assignment if exists
            const assignment = await tx.tripAssignment.findFirst({
                where: { tripId, status: AssignmentStatus.ASSIGNED },
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
            }
        });
    }
}

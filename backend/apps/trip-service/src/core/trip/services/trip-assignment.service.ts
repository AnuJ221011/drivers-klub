import { prisma } from "@driversklub/database";
// import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js"; // Use strings or Prisma enum
enum AssignmentStatus {
    ASSIGNED = "ASSIGNED",
    ACTIVE = "ACTIVE",
    UNASSIGNED = "UNASSIGNED"
}
import { ProviderBookingService } from "../../provider/provider-booking.service.js";
import { ApiError, IdUtils, EntityType } from "@driversklub/common";

export class TripAssignmentService {
    static async assignDriver(tripId: string, driverId: string, tx: any = prisma) {
        const trip = await tx.ride.findFirst({
            where: {
                OR: [{ id: tripId }, { shortId: tripId }]
            }
        });
        if (!trip) throw new ApiError(404, "Trip not found");

        if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
            throw new ApiError(400, "Cannot assign driver to closed trip");
        }

        if (trip.status !== "CREATED") {
            // Allow re-assignment if status is DRIVER_ASSIGNED
        }

        const driver = await tx.driver.findFirst({
            where: { OR: [{ id: driverId }, { shortId: driverId }] },
        });
        if (!driver) throw new ApiError(404, "Driver not found");

        const existingAssignment = await tx.tripAssignment.findFirst({
            where: {
                tripId: trip.id,
                status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] }
            },
        });

        if (existingAssignment) {
            throw new ApiError(400, "Trip already assigned");
        }

        let assignmentId: string = "";

        const shortId = await IdUtils.generateShortId(tx, EntityType.ASSIGNMENT as any);

        const assignment = await tx.tripAssignment.create({
            data: {
                shortId,
                tripId: trip.id,
                driverId: driver.id,
                status: AssignmentStatus.ASSIGNED,
            },
        });
        assignmentId = assignment.id;

        await tx.driver.update({
            where: { id: driver.id },
            data: { isAvailable: false },
        });

        await tx.ride.update({
            where: { id: trip.id },
            data: { status: "DRIVER_ASSIGNED" }
        });


        // ProviderBookingService usually handles external API.
        // Let's keep it safe.
        try {
            if (assignmentId) {
                await ProviderBookingService.bookAfterAssignment(
                    trip.id,
                    assignmentId
                );
            }
        } catch (error) {
            console.error(
                "[PROVIDER_BOOKING_FAILED]",
                error instanceof Error ? error.message : error
            );
        }

        return assignment;
    }

    static async unassignDriver(tripId: string, tx: any = prisma) {
        const trip = await tx.ride.findFirst({
            where: {
                OR: [{ id: tripId }, { shortId: tripId }]
            }
        });

        // Allow removal if CREATED, DRIVER_ASSIGNED, or STARTED (detach scenario)
        const allowedStatuses = ["CREATED", "DRIVER_ASSIGNED", "STARTED"];
        if (!trip || !allowedStatuses.includes(trip.status)) {
            throw new ApiError(400, "Trip is not eligible for unassignment");
        }

        const assignment = await tx.tripAssignment.findFirst({
            where: { tripId: trip.id, status: AssignmentStatus.ASSIGNED },
            include: { driver: true },
        });

        if (!assignment) {
            // If no assignment but status is DRIVER_ASSIGNED, fix status?
            if (trip && trip.status === "DRIVER_ASSIGNED") {
                await tx.ride.update({ where: { id: trip.id }, data: { status: "CREATED" } });
            }
            return { success: true }; // Nothing to do
        }

        await tx.tripAssignment.update({
            where: { id: assignment.id },
            data: {
                status: AssignmentStatus.UNASSIGNED,
                unassignedAt: new Date(),
            },
        });

        await tx.driver.update({
            where: { id: assignment.driverId },
            data: { isAvailable: true },
        });

        // REVERT RIDE STATUS
        await tx.ride.update({
            where: { id: trip.id },
            data: { status: "CREATED" }
        });

        return { success: true };
    }

    static async reassignDriver(
        tripId: string,
        newDriverId: string
    ) {
        return prisma.$transaction(async (tx) => {
            const trip = await tx.ride.findFirst({
                where: {
                    OR: [{ id: tripId }, { shortId: tripId }]
                },
                include: { providerMapping: true }
            });
            if (!trip) throw new ApiError(404, "Trip not found");

            const newDriver = await tx.driver.findFirst({
                where: { OR: [{ id: newDriverId }, { shortId: newDriverId }] },
            });
            if (!newDriver) throw new ApiError(404, "New driver not found");

            // Find existing assignment
            const existingAssignment = await tx.tripAssignment.findFirst({
                where: {
                    tripId: trip.id,
                    status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] }
                },
                include: { driver: true }
            });

            if (!existingAssignment) {
                throw new ApiError(400, "No active assignment found to reassign");
            }

            const oldDriverId = existingAssignment.driverId;

            // For MMT trips, we reassign directly without unassign/assign cycle
            // This ensures we send MMT reassign event instead of unassign + assign
            
            // 1. Mark old assignment as unassigned
            await tx.tripAssignment.update({
                where: { id: existingAssignment.id },
                data: {
                    status: AssignmentStatus.UNASSIGNED,
                    unassignedAt: new Date(),
                },
            });

            // 2. Make old driver available
            await tx.driver.update({
                where: { id: oldDriverId },
                data: { isAvailable: true },
            });

            // 3. Create new assignment
            const shortId = await IdUtils.generateShortId(tx, EntityType.ASSIGNMENT as any);
            const newAssignment = await tx.tripAssignment.create({
                data: {
                    shortId,
                    tripId: trip.id,
                    driverId: newDriver.id,
                    status: AssignmentStatus.ASSIGNED,
                },
            });

            // 4. Mark new driver as unavailable
            await tx.driver.update({
                where: { id: newDriver.id },
                data: { isAvailable: false },
            });

            // 5. Update trip status (should already be DRIVER_ASSIGNED, but ensure)
            await tx.ride.update({
                where: { id: trip.id },
                data: { status: "DRIVER_ASSIGNED" }
            });

            return newAssignment;
        });
    }
}

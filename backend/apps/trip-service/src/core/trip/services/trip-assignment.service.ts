import { prisma } from "@driversklub/database";
// import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js"; // Use strings or Prisma enum
enum AssignmentStatus {
  ASSIGNED = "ASSIGNED",
  ACTIVE = "ACTIVE",
  UNASSIGNED = "UNASSIGNED"
}
import { ProviderBookingService } from "../../provider/provider-booking.service.js";
import { ApiError } from "@driversklub/common";

export class TripAssignmentService {
  static async assignDriver(tripId: string, driverId: string, tx: any = prisma) {
    const trip = await tx.ride.findUnique({ where: { id: tripId } });
    if (!trip) throw new ApiError(404, "Trip not found");

    if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
      throw new ApiError(400, "Cannot assign driver to closed trip");
    }

    if (trip.status !== "CREATED") {
      // Allow re-assignment if status is DRIVER_ASSIGNED
    }

    const driver = await tx.driver.findUnique({
      where: { id: driverId },
    });
    if (!driver) throw new ApiError(404, "Driver not found");

    const existingAssignment = await tx.tripAssignment.findFirst({
      where: {
        tripId,
        status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] }
      },
    });

    if (existingAssignment) {
      throw new ApiError(400, "Trip already assigned");
    }

    let assignmentId: string = "";

    const assignment = await tx.tripAssignment.create({
      data: {
        tripId,
        driverId,
        status: AssignmentStatus.ASSIGNED,
      },
    });
    assignmentId = assignment.id;

    await tx.driver.update({
      where: { id: driverId },
      data: { isAvailable: false },
    });

    await tx.ride.update({
      where: { id: tripId },
      data: { status: "DRIVER_ASSIGNED" }
    });


    // ProviderBookingService usually handles external API.
    // Let's keep it safe.
    try {
      if (assignmentId) {
        await ProviderBookingService.bookAfterAssignment(
          tripId,
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
    const trip = await tx.ride.findUnique({
      where: { id: tripId },
    });

    // Allow removal if CREATED, DRIVER_ASSIGNED, or STARTED (detach scenario)
    const allowedStatuses = ["CREATED", "DRIVER_ASSIGNED", "STARTED"];
    if (!trip || !allowedStatuses.includes(trip.status)) {
      throw new ApiError(400, "Trip is not eligible for unassignment");
    }

    const assignment = await tx.tripAssignment.findFirst({
      where: { tripId, status: AssignmentStatus.ASSIGNED },
      include: { driver: true },
    });

    if (!assignment) {
      // If no assignment but status is DRIVER_ASSIGNED, fix status?
      if (trip && trip.status === "DRIVER_ASSIGNED") {
        await tx.ride.update({ where: { id: tripId }, data: { status: "CREATED" } });
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
      where: { id: tripId },
      data: { status: "CREATED" }
    });

    return { success: true };
  }

  static async reassignDriver(
    tripId: string,
    newDriverId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Unassign old driver
      await this.unassignDriver(tripId, tx);

      // Assign new driver
      return this.assignDriver(tripId, newDriverId, tx);
    });
  }
}

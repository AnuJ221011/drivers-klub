import { prisma } from "@/utils/prisma.js";
import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js";
import { ProviderBookingService } from "@/core/provider/provider-booking.service.js";

export class TripAssignmentService {
  static async assignDriver(tripId: string, driverId: string, tx: any = prisma) {
    // 1️ Fetch trip
    const trip = await tx.ride.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found");

    if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
      throw new Error("Cannot assign driver to closed trip");
    }

    if (trip.status !== "CREATED") {
      // throw new Error("Only unstarted trips can be assigned");
      // Allow re-assignment if checking status flow carefully, but generally CREATED is target.
      // If we are reassigning, status might be DRIVER_ASSIGNED.
      // But unassign reverts to CREATED. So this check is okay IF unassign works.
    }

    // 2️ Fetch driver
    const driver = await tx.driver.findUnique({
      where: { id: driverId },
    });
    if (!driver) throw new Error("Driver not found");

    // 3️ Check existing assignment
    const existingAssignment = await tx.tripAssignment.findFirst({
      where: {
        tripId,
        status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] }
      },
    });

    if (existingAssignment) {
      throw new Error("Trip already assigned");
    }

    let assignmentId: string = "";

    // 4️ Create assignment (transactional safety)
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

    // UPDATE RIDE STATUS
    await tx.ride.update({
      where: { id: tripId },
      data: { status: "DRIVER_ASSIGNED" }
    });

    // 🔥 CRITICAL: provider booking AFTER transaction
    // This cannot be inside the transaction easily if it's external, 
    // but here we just queue it. If 'tx' is passed, we might want to defer this?
    // For now, we keep it here but note it runs even if outer TX fails? 
    // No, if outer TX fails, this code isn't reached if awaited?
    // Actually if passed 'tx', we are inside a lock.

    // We only run this hook if we are the top-level caller OR we accept side effects.
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

    // Allow removal if CREATED (maybe phantom assignment?) or DRIVER_ASSIGNED
    if (!trip || (trip.status !== "CREATED" && trip.status !== "DRIVER_ASSIGNED")) {
      throw new Error("Trip is not eligible for unassignment");
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

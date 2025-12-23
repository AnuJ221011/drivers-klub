import { prisma } from "@/utils/prisma.js";
import { AssignmentStatus } from "@/shared/enums/assignment-status.enum.js";
import { ProviderBookingService } from "@/core/provider/provider-booking.service.js";

export class TripAssignmentService {
  static async assignDriver(tripId: string, driverId: string) {
    // 1️ Fetch trip
    const trip = await prisma.ride.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Trip not found");

    if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
      throw new Error("Cannot assign driver to closed trip");
    }

    if (trip.status !== "CREATED") {
      throw new Error("Only unstarted trips can be assigned");
    }

    // 2️ Fetch driver
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) throw new Error("Driver not found");
    // if (!driver.isAvailable) {
    //   throw new Error("Driver is not available");
    // }

    // 3️ Check existing assignment
    const existingAssignment = await prisma.tripAssignment.findFirst({
      where: {
        tripId,
        status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACTIVE] }
      },
    });

    if (existingAssignment) {
      throw new Error("Trip already assigned");
    }

    let assignmentId: string;

    // 4️ Create assignment (transactional safety)
    await prisma.$transaction(async (tx) => {
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

      return assignment;
    });

    // 🔥 CRITICAL: provider booking AFTER transaction
    try {
      await ProviderBookingService.bookAfterAssignment(
        tripId,
        assignmentId!
      );
    } catch (error) {
      // Do NOT throw — assignment already failed safely
      console.error(
        "[PROVIDER_BOOKING_FAILED]",
        error instanceof Error ? error.message : error
      );
    }

    // Return success object as we can't return the assignment object directly now
    // or fetch it again if needed, but for now simple success is enough per instruction logic
    return { success: true };
  }

  static async unassignDriver(tripId: string) {
    const trip = await prisma.ride.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.status !== "CREATED") {
      throw new Error("Trip is not eligible for unassignment");
    }

    const assignment = await prisma.tripAssignment.findFirst({
      where: { tripId, status: AssignmentStatus.ASSIGNED },
      include: { driver: true },
    });

    if (!assignment) {
      throw new Error("No active assignment found");
    }

    if (assignment.status !== AssignmentStatus.ASSIGNED) {
      throw new Error("Assignment is not active");
    }

    return prisma.$transaction(async (tx) => {
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

      return { success: true };
    });
  }

  static async reassignDriver(
    tripId: string,
    newDriverId: string
  ) {
    return prisma.$transaction(async () => {
      // Unassign old driver
      await this.unassignDriver(tripId);

      // Assign new driver
      return this.assignDriver(tripId, newDriverId);
    });
  }
}

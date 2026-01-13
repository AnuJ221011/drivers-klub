import { prisma } from "@driversklub/database";

export type TripAssignmentRow = {
  id: string;
  tripId: string;
  driverId: string;
  status: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActiveFleetAssignmentRow = {
  driverId: string;
  vehicleId: string;
};

export class AssignmentRepository {
  create(data: any) {
    return prisma.assignment.create({ data });
  }

  findTripAssignments(tripId: string): Promise<TripAssignmentRow[]> {
    return prisma.tripAssignment.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" }
    });
  }

  findActiveFleetAssignmentsByDriverIds(driverIds: string[]): Promise<ActiveFleetAssignmentRow[]> {
    if (driverIds.length === 0) return Promise.resolve([]);
    return prisma.assignment.findMany({
      where: {
        driverId: { in: driverIds },
        status: "ACTIVE"
      },
      select: {
        driverId: true,
        vehicleId: true
      }
    });
  }

  findActiveByDriver(driverId: string) {
    return prisma.assignment.findFirst({
      where: { driverId, status: "ACTIVE" }
    });
  }

  findActiveByVehicle(vehicleId: string) {
    return prisma.assignment.findFirst({
      where: { vehicleId, status: "ACTIVE" }
    });
  }

  findByFleet(fleetId: string) {
    return prisma.assignment.findMany({ where: { fleetId } });
  }

  findById(id: string) {
    return prisma.assignment.findUnique({ where: { id } });
  }

  endAssignment(id: string) {
    return prisma.assignment.update({
      where: { id },
      data: { status: "ENDED", endTime: new Date() }
    });
  }
}
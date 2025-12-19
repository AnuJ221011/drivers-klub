import { prisma } from "../../utils/prisma.js";

export class AssignmentRepository {
  create(data: any) {
    return prisma.assignment.create({ data });
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

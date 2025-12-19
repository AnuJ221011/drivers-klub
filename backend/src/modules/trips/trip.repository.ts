import { prisma } from "../../utils/prisma.js";

export class TripRepository {
  create(data: any) {
    return prisma.trip.create({ data });
  }

  findById(id: string) {
    return prisma.trip.findUnique({ where: { id } });
  }

  findByFleet(fleetId: string) {
    return prisma.trip.findMany({ where: { fleetId } });
  }

  findByDriver(driverId: string) {
    return prisma.trip.findMany({ where: { driverId } });
  }

  startTrip(id: string) {
    return prisma.trip.update({
      where: { id },
      data: { status: "STARTED", startedAt: new Date() }
    });
  }

  completeTrip(id: string, fare?: number) {
    return prisma.trip.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        fare
      }
    });
  }
}

import { TripRepository } from "./trip.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

export class TripService {
  private repo = new TripRepository();

  async createTrip(data: { assignmentId: string; pickup: string; drop?: string }) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId }
    });

    if (!assignment || assignment.status !== "ACTIVE") {
      throw new ApiError(400, "Active assignment required to create trip");
    }

    return this.repo.create({
      assignmentId: assignment.id,
      fleetId: assignment.fleetId,
      driverId: assignment.driverId,
      vehicleId: assignment.vehicleId,
      pickup: data.pickup,
      drop: data.drop
    });
  }

  async startTrip(tripId: string, driverUserId: string) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    if (trip.status !== "CREATED") throw new ApiError(400, "Trip not startable");

    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId }
    });
    if (!driver || driver.id !== trip.driverId) {
      throw new ApiError(403, "Not authorized to start this trip");
    }

    return this.repo.startTrip(tripId);
  }

  async completeTrip(tripId: string, driverUserId: string, fare?: number) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    if (trip.status !== "STARTED") throw new ApiError(400, "Trip not completable");

    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId }
    });
    if (!driver || driver.id !== trip.driverId) {
      throw new ApiError(403, "Not authorized to complete this trip");
    }

    return this.repo.completeTrip(tripId, fare);
  }

  getTripsByFleet(fleetId: string) {
    return this.repo.findByFleet(fleetId);
  }

  getTripsByDriver(driverId: string) {
    return this.repo.findByDriver(driverId);
  }
}

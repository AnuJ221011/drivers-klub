import { TripRepository } from "./trip.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { GeoUtils } from "../../utils/geo.util.js";

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
    if (trip.status !== "CREATED" && trip.status !== "DRIVER_ASSIGNED") {
      throw new ApiError(400, "Trip not startable");
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId }
    });

    const isAssigned = trip.tripAssignments.some((ta: any) => ta.driverId === driver?.id);
    if (!driver || !isAssigned) {
      throw new ApiError(403, "Not authorized to start this trip");
    }

    /**
     * STRICT CONSTRAINT: 2.5 Hour Start Window
     * Driver can only start trip within 2.5 hours of pickup time.
     * This prevents early starts and ensures operational compliance.
     */
    const now = new Date();
    const pickupTime = new Date(trip.pickupTime);
    const msDiff = pickupTime.getTime() - now.getTime();
    const hoursDiff = msDiff / (1000 * 60 * 60);

    if (hoursDiff > 2.5) {
      throw new ApiError(400, `Trip cannot be started yet. You can start 2.5 hours before pickup. (Window opens at ${new Date(pickupTime.getTime() - 2.5 * 60 * 60 * 1000).toLocaleTimeString()})`);
    }

    return this.repo.startTrip(tripId);
  }

  async arriveTrip(tripId: string, driverUserId: string, lat: number, lng: number) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    if (trip.status !== "STARTED") throw new ApiError(400, "Trip must be in STARTED state to mark Arrived");

    // Authorization check: Verify driver is assigned to this trip
    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId }
    });

    const isAssigned = trip.tripAssignments.some((ta: any) => ta.driverId === driver?.id);
    if (!driver || !isAssigned) {
      throw new ApiError(403, "Not authorized to update this trip");
    }

    /**
     * STRICT CONSTRAINT: 500m Geofence
     * Driver must be within 500 meters of pickup location.
     * Uses Haversine formula for accurate distance calculation.
     */
    if (trip.pickupLat && trip.pickupLng) {
      const distance = GeoUtils.getDistanceInMeters(lat, lng, trip.pickupLat, trip.pickupLng);
      if (distance > 500) {
        throw new ApiError(400, `You are ${Math.round(distance)}m away from pickup. Please reach within 500m.`);
      }
    } else {
      console.warn(`Trip ${tripId} has no pickup coordinates. Skipping strict geofence.`);
    }

    /**
     * STRICT CONSTRAINT: 30 Minute Arrival Window
     * Driver can only mark arrived within 30 minutes of pickup time.
     */
    const now = new Date();
    const pickupTime = new Date(trip.pickupTime);
    const msDiff = pickupTime.getTime() - now.getTime();
    const minutesDiff = msDiff / (1000 * 60);

    if (minutesDiff > 30) {
      throw new ApiError(400, "Too early to mark Arrived. Please wait until 30 mins before pickup.");
    } else if (minutesDiff < -30) {
      throw new ApiError(400, "Pickup time has passed. Cannot mark arrived more than 30 mins after scheduled pickup.");
    }

    return { success: true, message: "Geofence & Time validation passed" };
  }

  async noShowTrip(tripId: string, driverUserId: string) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    if (trip.status !== "STARTED") {
      throw new ApiError(400, "Trip must be in STARTED state to mark No Show");
    }

    // Authorization check: Verify driver is assigned to this trip
    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId }
    });

    const isAssigned = trip.tripAssignments.some((ta: any) => ta.driverId === driver?.id);
    if (!driver || !isAssigned) {
      throw new ApiError(403, "Not authorized to update this trip");
    }

    /**
     * STRICT CONSTRAINT: 30 Minute No-Show Window
     * Driver can only mark no-show AFTER 30 minutes past pickup time.
     * This ensures adequate waiting time for customer arrival.
     */
    const now = new Date();
    const pickupTime = new Date(trip.pickupTime);
    const msDiff = now.getTime() - pickupTime.getTime();
    const minutesDiff = msDiff / (1000 * 60);

    if (minutesDiff < 30) {
      throw new ApiError(400, `Cannot mark No Show yet. Wait until 30 mins after pickup time. (Current: ${Math.round(minutesDiff)} mins)`);
    }

    const updated = await prisma.ride.update({
      where: { id: tripId },
      data: { status: "NO_SHOW", completedAt: new Date() }
    });

    return updated;
  }

  async completeTrip(tripId: string, driverUserId: string, fare?: number) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    if (trip.status !== "STARTED") {
      throw new ApiError(400, "Trip not completable");
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId }
    });

    const isAssigned = trip.tripAssignments.some((ta: any) => ta.driverId === driver?.id);
    if (!driver || !isAssigned) {
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

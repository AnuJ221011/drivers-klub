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

    // Time Check: 2.5 hours window
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

    // Geofence Check (500m)
    // Only check if coordinates exist in DB
    if (trip.pickupLat && trip.pickupLng) {
      const distance = GeoUtils.getDistanceInMeters(lat, lng, trip.pickupLat, trip.pickupLng);
      if (distance > 500) {
        throw new ApiError(400, `You are ${Math.round(distance)}m away from pickup. Please reach within 500m.`);
      }
    } else {
      // Fallback or skip if legacy trip without coords
      console.warn(`Trip ${tripId} has no pickup coordinates. Skipping strict geofence.`);
    }

    // Time Check (30 mins before pickup)
    const now = new Date();
    const pickupTime = new Date(trip.pickupTime);
    const msDiff = pickupTime.getTime() - now.getTime();
    const minutesDiff = msDiff / (1000 * 60);

    if (minutesDiff > 30) {
      throw new ApiError(400, "Too early to mark Arrived. Please wait until 30 mins before pickup.");
    }

    // We don't have a status for ARRIVED in RideStatus enum usually, 
    // but Controller sends 'ARRIVED_EVENT_SENT' dummy status. 
    // Here we just return success or update a separate field if available.
    // For now, we allow the controller to handle the webhook.
    return { success: true, message: "Geofence & Time validation passed" };
  }

  async noShowTrip(tripId: string, driverUserId: string) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    // Can only mark No Show if trip is STARTED (Driver arrived) but customer didn't board
    // Or if driver is ASSIGNED and waited? Usually Driver must arrive to claim No Show.
    // Let's assume Status must be STARTED (which includes Arrived in our DB model)
    if (trip.status !== "STARTED") throw new ApiError(400, "Trip must be in STARTED state to mark No Show");

    // Time Check (30 mins after pickup)
    const now = new Date();
    const pickupTime = new Date(trip.pickupTime);
    const msDiff = now.getTime() - pickupTime.getTime();
    const minutesDiff = msDiff / (1000 * 60);

    if (minutesDiff < 30) {
      throw new ApiError(400, `Cannot mark No Show yet. Wait until 30 mins after pickup time. (Current: ${Math.round(minutesDiff)} mins)`);
    }

    // Update Status
    const updated = await prisma.ride.update({
      where: { id: tripId },
      data: { status: "NO_SHOW", completedAt: new Date() } // Mark as done
    });

    return updated;
  }

  async completeTrip(tripId: string, driverUserId: string, fare?: number) {
    const trip = await this.repo.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    // Strict: Must be STARTED (or ARRIVED if we had that state)
    // Allowing STARTED -> COMPLETED for now.
    if (trip.status !== "STARTED") throw new ApiError(400, "Trip not completable");

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

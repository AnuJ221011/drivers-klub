import { Request, Response } from "express";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { RideProviderMappingRepository } from "../../core/trip/repositories/ride-provider-mapping.repo.js";
import { prisma } from "../../utils/prisma.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { RideStatus } from "../../shared/enums/ride-status.enum.js";


export class TripController {
  constructor(
    private orchestrator: TripOrchestrator,
    private mappingRepo: RideProviderMappingRepository
  ) { }

  async createTrip(req: Request, res: Response) {
    const trip = await this.orchestrator.createTrip(req.body);
    return ApiResponse.send(res, 201, trip, "Trip created successfully");
  }

  async getTripsByFleet(req: Request, res: Response) {
    const { fleetId } = req.params;

    const trips = await prisma.ride.findMany({
      where: { fleetId },
      orderBy: { createdAt: "desc" }
    });

    return ApiResponse.send(res, 200, trips, "Trips retrieved successfully");
  }

  async getTrip(req: Request, res: Response) {
    const { id } = req.params;

    const trip = await prisma.ride.findUnique({
      where: { id },
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const mapping = await this.mappingRepo.findByRideId(id);

    const mappedTrip = {
      ...trip,
      provider: mapping?.providerType,
    };
    return ApiResponse.send(res, 200, mappedTrip, "Trip retrieved successfully");
  }

  async assignDriver(req: Request, res: Response) {
    const { id } = req.params;
    const { driverId } = req.body;

    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) return res.status(404).json({ message: "Trip not found" });

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // If ride is fleet-scoped, enforce same-fleet assignment
    if (ride.fleetId && driver.fleetId !== ride.fleetId) {
      return res.status(400).json({ message: "Driver must belong to the same fleet as this trip" });
    }

    // Optional safety: only allow ACTIVE + available drivers
    if (driver.status !== "ACTIVE") {
      return res.status(400).json({ message: "Driver is not ACTIVE" });
    }
    if (!driver.isAvailable) {
      return res.status(400).json({ message: "Driver is not available" });
    }

    await prisma.tripAssignment.create({
      data: {
        tripId: id,
        driverId: driverId,
        status: "ASSIGNED"
      }
    });

    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "DRIVER_ASSIGNED" }
    });

    return ApiResponse.send(res, 200, updated, "Driver assigned successfully");
  }

  async startTrip(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "STARTED" }
    });
    return ApiResponse.send(res, 200, updated, "Trip started successfully");
  }

  async completeTrip(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "COMPLETED" }
    });
    return ApiResponse.send(res, 200, updated, "Trip completed successfully");
  }

  async getTracking(req: Request, res: Response) {
    const { id } = req.params;

    const mapping = await this.mappingRepo.findByRideId(id);
    if (!mapping) {
      return res.status(404).json({ message: "Tracking not available" });
    }

    const provider = (this.orchestrator as any)["registry"].get(
      mapping.providerType
    );

    const tracking = await provider.trackRide({
      bookingId: mapping.externalBookingId,
    });

    return ApiResponse.send(res, 200, {
      source: tracking.data.source,
      destination: tracking.data.destination,
      live: tracking.data.live,
    }, "Tracking data retrieved successfully");
  }

  async updateTripStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = (req.body ?? {}) as { status?: RideStatus | string };

    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "status is required" });
    }

    const allowed = Object.values(RideStatus);
    if (!allowed.includes(status as RideStatus)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowed.join(", ")}`
      });
    }

    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) return res.status(404).json({ message: "Trip not found" });

    const updated = await prisma.ride.update({
      where: { id },
      data: { status: status as RideStatus }
    });

    return ApiResponse.send(res, 200, updated, "Trip status updated successfully");
  }
}

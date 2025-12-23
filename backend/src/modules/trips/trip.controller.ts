import { Request, Response } from "express";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { RideProviderMappingRepository } from "../../core/trip/repositories/ride-provider-mapping.repo.js";
import { prisma } from "../../utils/prisma.js";
import { ApiResponse } from "../../utils/apiResponse.js";


export class TripController {
  constructor(
    private orchestrator: TripOrchestrator,
    private mappingRepo: RideProviderMappingRepository
  ) { }

  async createTrip(req: Request, res: Response) {
    const trip = await this.orchestrator.createTrip(req.body);
    return ApiResponse.send(res, 201, trip, "Trip created successfully");
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
}

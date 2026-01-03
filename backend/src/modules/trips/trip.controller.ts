import { Request, Response } from "express";
import { TripOrchestrator } from "../../core/trip/orchestrator/trip.orchestrator.js";
import { RideProviderMappingRepository } from "../../core/trip/repositories/ride-provider-mapping.repo.js";
import { prisma } from "../../utils/prisma.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { MMTWebhook } from "../partner/mmt/mmt.webhook.js";
import { TripService } from "./trip.service.js";

export class TripController {
  private mmtWebhook = new MMTWebhook();
  private tripService = new TripService();

  constructor(
    private orchestrator: TripOrchestrator,
    private mappingRepo: RideProviderMappingRepository
  ) { }

  async createTrip(req: Request, res: Response) {
    try {
      const trip = await this.orchestrator.createTrip(req.body);
      return ApiResponse.send(res, 201, trip, "Trip created successfully");
    } catch (error: any) {
      console.error("Create Trip Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
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

    // 1. Create Assignment
    await prisma.tripAssignment.create({
      data: {
        tripId: id,
        driverId: driverId,
        status: "ASSIGNED"
      }
    });

    // 2. Update Status
    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "DRIVER_ASSIGNED" }
    });

    // 3. MMT Hook
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    const mapping = await this.mappingRepo.findByRideId(id);

    if (mapping && mapping.providerType === "MMT" && driver) {
      await this.mmtWebhook.pushDriverAssignment(mapping.externalBookingId, driver);
    }

    return ApiResponse.send(res, 200, updated, "Driver assigned successfully");
  }

  async startTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body; // Expect location
      const userId = (req.user as any)?.id; // Need userId for auth

      // Use TripService for logic & auth
      const updated = await this.tripService.startTrip(id, userId);

      // MMT Hook (still needed here or move to Service?)
      // Keeping here for now to match pattern
      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushStartTrip(mapping.externalBookingId, lat || 0, lng || 0);
      }

      return ApiResponse.send(res, 200, updated, "Trip started successfully");
    } catch (error: any) {
      console.error("startTrip Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async arriveTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;
      const userId = (req.user as any)?.id;

      await this.tripService.arriveTrip(id, userId, lat, lng);

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushArrived(mapping.externalBookingId, lat || 0, lng || 0);
      }
      return ApiResponse.send(res, 200, { id, status: "ARRIVED_EVENT_SENT" }, "Driver marked as arrived");
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async onboardTrip(req: Request, res: Response) {
    const { id } = req.params;
    const { otp } = req.body;

    const updated = await prisma.ride.update({
      where: { id },
      data: { status: "STARTED" } // Re-confirming start
    });

    const mapping = await this.mappingRepo.findByRideId(id);
    if (mapping && mapping.providerType === "MMT") {
      await this.mmtWebhook.pushOnboard(mapping.externalBookingId, otp || "0000");
    }
    return ApiResponse.send(res, 200, updated, "Passenger boarded");
  }

  async noShowTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;

      const updated = await this.tripService.noShowTrip(id, userId);

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushNoShow(mapping.externalBookingId);
      }
      return ApiResponse.send(res, 200, updated, "Trip marked as No Show");
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async completeTrip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { distance, fare } = req.body;
      const userId = (req.user as any)?.id;

      // Use TripService
      const updated = await this.tripService.completeTrip(id, userId, fare);

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushComplete(mapping.externalBookingId, distance || 0, fare || 0);
      }

      return ApiResponse.send(res, 200, updated, "Trip completed successfully");
    } catch (error: any) {
      console.error("completeTrip Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  async getDriverTrips(req: Request, res: Response) {
    const { id: userId, role } = req.user as any;
    const { status } = req.query; // Support filtering (e.g. ?status=COMPLETED)

    if (role !== "DRIVER") {
      return res.status(403).json({ message: "Only drivers can access this endpoint" });
    }

    const driver = await prisma.driver.findFirst({ where: { userId } });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    let statusFilter = {};
    if (status === "HISTORY") {
      statusFilter = { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] };
    } else {
      // Default to active
      statusFilter = { in: ["DRIVER_ASSIGNED", "STARTED"] };
    }

    const trips = await prisma.ride.findMany({
      where: {
        tripAssignments: {
          some: {
            driverId: driver.id,
            status: "ASSIGNED"
          }
        },
        status: statusFilter
      },
      include: {
        tripAssignments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return ApiResponse.send(res, 200, trips, "Trips retrieved");
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

  async updateLocation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { lat, lng } = req.body;

      // Validate input
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and Longitude are required" });
      }

      // We could persist this location to a RideLocationHistory table here if needed.
      // For now, we just foward it to the provider.

      const mapping = await this.mappingRepo.findByRideId(id);
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushUpdateLocation(mapping.externalBookingId, lat, lng);
      }

      return ApiResponse.send(res, 200, null, "Location updated successfully");
    } catch (error: any) {
      console.error("updateLocation Error:", error);
      return res.status(error.statusCode || 500).json({ message: error.message });
    }
  }
}

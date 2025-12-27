import { Request, Response } from "express";
import { TripAssignmentService } from "@/core/trip/services/trip-assignment.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

import { prisma } from "../../utils/prisma.js";
import { MMTWebhook } from "../partner/mmt/mmt.webhook.js";

export class AdminTripController {
  private mmtWebhook = new MMTWebhook();

  async assignDriver(req: Request, res: Response) {
    const { tripId, driverId } = req.body;

    try {
      const assignment = await TripAssignmentService.assignDriver(
        tripId,
        driverId
      );

      await this.pushDriverDetails(tripId, driverId);

      return ApiResponse.send(res, 201, { assignment }, "Driver assigned successfully");
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async unassignDriver(req: Request, res: Response) {
    const { tripId } = req.body;

    await TripAssignmentService.unassignDriver(tripId);

    // NOTE: TripAssignmentService already reverts ride status to CREATED.
    // We should not cancel the trip here; unassign should keep it re-dispatchable.

    // MMT Hook (Detach driver)
    await this.pushDetachDetails(tripId);

    return ApiResponse.send(res, 200, null, "Driver unassigned successfully");
  }

  async reassignDriver(req: Request, res: Response) {
    const { tripId, driverId } = req.body;

    try {
      const assignment =
        await TripAssignmentService.reassignDriver(
          tripId,
          driverId
        );

      await this.pushReassignDetails(tripId, driverId);

      return ApiResponse.send(res, 200, { assignment }, "Driver reassigned successfully");
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getAllTrips(req: Request, res: Response) {

    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { status } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [trips, total] = await Promise.all([
        prisma.ride.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            tripAssignments: {
              include: {
                driver: true
              }
            },
            providerMapping: true
          }
        }),
        prisma.ride.count({ where })
      ]);

      return ApiResponse.send(res, 200, { trips, total, page, limit }, "Trips retrieved successfully");
    } catch (error: any) {
      console.error("getAllTrips Error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  private async pushDriverDetails(tripId: string, driverId: string) {
    try {
      const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: tripId } });
      if (mapping && mapping.providerType === "MMT") {
        const driver = await prisma.driver.findUnique({ where: { id: driverId } });
        if (driver) {
          await this.mmtWebhook.pushDriverAssignment(mapping.externalBookingId, driver);
        }
      }
    } catch (e) {
      console.error("Failed to push MMT driver update", e);
    }
  }

  private async pushReassignDetails(tripId: string, driverId: string) {
    try {
      const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: tripId } });
      if (mapping && mapping.providerType === "MMT") {
        const driver = await prisma.driver.findUnique({ where: { id: driverId } });
        if (driver) {
          await this.mmtWebhook.pushReassignChauffeur(mapping.externalBookingId, driver);
        }
      }
    } catch (e) {
      console.error("Failed to push MMT reassign update", e);
    }
  }

  private async pushDetachDetails(tripId: string) {
    try {
      const mapping = await prisma.rideProviderMapping.findUnique({ where: { rideId: tripId } });
      if (mapping && mapping.providerType === "MMT") {
        await this.mmtWebhook.pushDetachTrip(mapping.externalBookingId, "Driver Unassigned by Admin");
      }
    } catch (e) {
      console.error("Failed to push MMT detach", e);
    }
  }
}
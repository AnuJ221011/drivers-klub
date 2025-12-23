import { Request, Response } from "express";
import { TripAssignmentService } from "@/core/trip/services/trip-assignment.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export class AdminTripController {
  async assignDriver(req: Request, res: Response) {
    const { tripId, driverId } = req.body;

    const assignment = await TripAssignmentService.assignDriver(
      tripId,
      driverId
    );

    return ApiResponse.send(res, 201, { assignment }, "Driver assigned successfully");
  }

  async unassignDriver(req: Request, res: Response) {
    const { tripId } = req.body;

    await TripAssignmentService.unassignDriver(tripId);

    return ApiResponse.send(res, 200, null, "Driver unassigned successfully");
  }

  async reassignDriver(req: Request, res: Response) {
    const { tripId, driverId } = req.body;

    const assignment =
      await TripAssignmentService.reassignDriver(
        tripId,
        driverId
      );

    return ApiResponse.send(res, 200, { assignment }, "Driver reassigned successfully");
  }
}

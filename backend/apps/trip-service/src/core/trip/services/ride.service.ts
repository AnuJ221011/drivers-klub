// import { RideStatus } from "@prisma/client";
export enum RideStatus {
  CREATED = "CREATED",
  DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
  STARTED = "STARTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export class RideService {
  async createRide(_input: any) {
    return {
      id: "ride-id",
      status: RideStatus.CREATED,
    };
  }

  async updateStatus(_rideId: string, _status: RideStatus) {
    // persist status
  }
}

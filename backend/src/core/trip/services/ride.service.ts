import { RideStatus } from "@/shared/enums/ride-status.enum.js";

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

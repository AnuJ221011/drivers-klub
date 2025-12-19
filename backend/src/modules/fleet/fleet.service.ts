import { FleetRepository } from "./fleet.repository.js";
import { ApiError } from "../../utils/apiError.js";
import type { CreateFleetInput } from "./fleet.types.js";

export class FleetService {
  private fleetRepo = new FleetRepository();

  async createFleet(data: CreateFleetInput) {
    const existing = await this.fleetRepo.findByMobile(data.mobile);
    if (existing) {
      throw new ApiError(409, "Fleet with this mobile already exists");
    }

    return this.fleetRepo.create(data);
  }

  async getAllFleets() {
    return this.fleetRepo.findAll();
  }

  async getFleetById(id: string) {
    const fleet = await this.fleetRepo.findById(id);
    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }
    return fleet;
  }

  async deactivateFleet(id: string) {
    const fleet = await this.fleetRepo.findById(id);
    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }

    return this.fleetRepo.updateStatus(id, { status: "INACTIVE" });
  }
}

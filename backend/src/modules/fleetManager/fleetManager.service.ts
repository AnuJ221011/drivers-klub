import { FleetManagerRepository } from "./fleetManager.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type { CreateFleetManagerInput } from "./fleetManager.types.js";

export class FleetManagerService {
  private repo = new FleetManagerRepository();

  async createFleetManager(data: CreateFleetManagerInput) {
    const fleet = await prisma.fleet.findUnique({
      where: { id: data.fleetId }
    });

    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }

    const existing = await this.repo.findByMobile(data.mobile);
    if (existing) {
      throw new ApiError(409, "Fleet manager with this mobile already exists");
    }

    return this.repo.create(data);
  }

  async getFleetManagersByFleet(fleetId: string) {
    return this.repo.findByFleet(fleetId);
  }

  async deactivateFleetManager(id: string) {
    const manager = await this.repo.findById(id);
    if (!manager) {
      throw new ApiError(404, "Fleet manager not found");
    }

    return this.repo.updateStatus(id, { status: "INACTIVE" });
  }
}

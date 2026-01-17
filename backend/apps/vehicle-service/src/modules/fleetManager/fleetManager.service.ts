import { FleetManagerRepository } from "./fleetManager.repository.js";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";
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

    // We store managers in the User table (role=MANAGER). City/profilePicture are not persisted on User.
    return this.repo.create(data);
  }

  async getFleetManagersByFleet(fleetId: string) {
    return this.repo.findByFleet(fleetId);
  }

  async getFleetManagerById(id: string) {
    const manager = await this.repo.findById(id);
    if (!manager) {
      throw new ApiError(404, "Fleet manager not found");
    }
    return manager;
  }

  async deactivateFleetManager(id: string) {
    await this.getFleetManagerById(id);
    return this.repo.deactivate(id);
  }
}

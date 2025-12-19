import { VehicleRepository } from "./vehicle.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type { CreateVehicleInput } from "./vehicle.types.js";

export class VehicleService {
  private repo = new VehicleRepository();

  async createVehicle(data: CreateVehicleInput) {
    const fleet = await prisma.fleet.findUnique({
      where: { id: data.fleetId }
    });

    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }

    const existing = await this.repo.findByVehicleNumber(data.vehicleNumber);
    if (existing) {
      throw new ApiError(409, "Vehicle with this number already exists");
    }

    return this.repo.create(data);
  }

  async getVehiclesByFleet(fleetId: string) {
    return this.repo.findByFleet(fleetId);
  }

  async getVehicleById(id: string) {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }
    return vehicle;
  }

  async updateVehicleDocs(id: string, data: any) {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }
    return this.repo.updateDocs(id, data);
  }

  async deactivateVehicle(id: string) {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }
    return this.repo.updateStatus(id, { status: "INACTIVE" });
  }
}

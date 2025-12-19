import { DriverRepository } from "./driver.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type { CreateDriverInput } from "./driver.types.js";

export class DriverService {
  private driverRepo = new DriverRepository();

  async createDriver(data: CreateDriverInput) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "DRIVER") {
      throw new ApiError(400, "User role must be DRIVER");
    }

    const existing = await this.driverRepo.findByUserId(data.userId);
    if (existing) {
      throw new ApiError(409, "Driver profile already exists for this user");
    }

    const fleet = await prisma.fleet.findUnique({
      where: { id: data.fleetId }
    });

    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }

    return this.driverRepo.create(data);
  }

  async getDriversByFleet(fleetId: string) {
    return this.driverRepo.findAllByFleet(fleetId);
  }

  async getDriverById(id: string) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }
    return driver;
  }
}

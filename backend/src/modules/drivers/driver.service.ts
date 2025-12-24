import { DriverRepository } from "./driver.repository.js";
import { prisma } from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type {
  CreateDriverInput,
  UpdateDriverAvailabilityInput,
  UpdateDriverInput,
  UpdateDriverStatusInput
} from "./driver.types.js";

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

  async updateDriver(id: string, data: UpdateDriverInput) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");

    const update: UpdateDriverInput = {};
    if (typeof data.firstName === "string") update.firstName = data.firstName;
    if (typeof data.lastName === "string") update.lastName = data.lastName;
    if (typeof data.mobile === "string") update.mobile = data.mobile;
    if (typeof data.profilePic === "string") update.profilePic = data.profilePic;

    return this.driverRepo.updateDetails(id, update);
  }

  async updateDriverStatus(id: string, data: UpdateDriverStatusInput) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");
    if (!data?.status) throw new ApiError(400, "status is required");
    return this.driverRepo.updateStatus(id, data);
  }

  async updateDriverAvailability(id: string, data: UpdateDriverAvailabilityInput) {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new ApiError(404, "Driver not found");
    if (typeof data?.isAvailable !== "boolean") {
      throw new ApiError(400, "isAvailable must be boolean");
    }
    return this.driverRepo.updateAvailability(id, data);
  }
}

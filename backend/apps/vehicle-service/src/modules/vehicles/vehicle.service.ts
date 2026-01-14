import { VehicleRepository } from "./vehicle.repository.js";
import { prisma } from "@driversklub/database";
import { ApiError } from "@driversklub/common";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  UpdateVehicleStatusInput
} from "./vehicle.types.js";

export class VehicleService {
  private repo = new VehicleRepository();

  private assertFleetScope(user: any, fleetId: string) {
    const role = String(user?.role || "");
    if (role === "SUPER_ADMIN") return;
    const scopedFleetId = user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (scopedFleetId !== fleetId) throw new ApiError(403, "Access denied");
  }

  private assertVehicleScope(user: any, vehicle: { fleetId: string; hubId?: string | null }) {
    const role = String(user?.role || "");
    if (role === "SUPER_ADMIN") return;
    const scopedFleetId = user?.fleetId;
    if (!scopedFleetId) throw new ApiError(403, "Fleet scope not set for this user");
    if (vehicle.fleetId !== scopedFleetId) throw new ApiError(403, "Access denied");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(user?.hubIds) ? user.hubIds : [];
      if (!vehicle.hubId || !hubIds.includes(vehicle.hubId)) throw new ApiError(403, "Access denied");
    }
  }

  async createVehicle(data: CreateVehicleInput, user?: any) {
    if (user) this.assertFleetScope(user, data.fleetId);
    const fleet = await prisma.fleet.findUnique({
      where: { id: data.fleetId },
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

  async getVehiclesByFleet(fleetId: string, user?: any) {
    if (user) this.assertFleetScope(user, fleetId);
    const role = String(user?.role || "");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(user?.hubIds) ? user.hubIds : [];
      if (hubIds.length === 0) return [];
      return this.repo.findByFleetAndHubs(fleetId, hubIds);
    }
    return this.repo.findByFleet(fleetId);
  }

  async getVehiclesByHub(hubId: string, user?: any) {
    // Operations can only query their own hubs.
    const role = String(user?.role || "");
    if (role === "OPERATIONS") {
      const hubIds = Array.isArray(user?.hubIds) ? user.hubIds : [];
      if (!hubIds.includes(hubId)) throw new ApiError(403, "Access denied");
    }
    const vehicles = await this.repo.findByHub(hubId);
    // For non-super, ensure hub belongs to user's fleet by checking any returned vehicle fleetId.
    if (user && role !== "SUPER_ADMIN") {
      for (const v of vehicles) this.assertVehicleScope(user, v);
    }
    return vehicles;
  }

  async getVehicleById(id: string, user?: any) {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }
    if (user) this.assertVehicleScope(user, vehicle);
    return vehicle;
  }

  async updateVehicleDocs(id: string, data: any, user?: any) {
    await this.getVehicleById(id, user);
    return this.repo.updateDocs(id, data);
  }

  async deactivateVehicle(id: string, user?: any) {
    await this.getVehicleById(id, user);
    return this.repo.updateStatus(id, { status: "INACTIVE" });
  }

  async updateVehicle(id: string, data: UpdateVehicleInput, user?: any) {
    const vehicle = await this.getVehicleById(id, user);

    if (data.vehicleNumber && data.vehicleNumber !== vehicle.vehicleNumber) {
      const existing = await this.repo.findByVehicleNumber(data.vehicleNumber);
      if (existing) throw new ApiError(409, "Vehicle with this number already exists");
    }

    return this.repo.updateDetails(id, data);
  }

  async updateVehicleStatus(id: string, data: UpdateVehicleStatusInput, user?: any) {
    await this.getVehicleById(id, user);
    if (!data?.status) throw new ApiError(400, "status is required");
    return this.repo.updateStatus(id, data);
  }
} 
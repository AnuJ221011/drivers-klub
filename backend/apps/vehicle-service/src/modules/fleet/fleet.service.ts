import { prisma } from "@driversklub/database";
import {
  FleetHubRepository,
  FleetRepository,
  HubManagerRepository,
} from "./fleet.repository.js";
import { ApiError } from "@driversklub/common";
import type {
  CreateFleetInput,
  DriverInput,
  VehicleInput,
} from "./fleet.types.js";
import { AssignManagerInput, CreateFleetHubInput } from "./fleetHub.types.js";
import { CreateHubManagerInput } from "./hubManager.types.js";
import { VehicleRepository } from "../vehicles/vehicle.repository.js";

// DriverRepository removed to avoid circular dependency - usage replaced with direct prisma calls

export class FleetService {
  private fleetRepo = new FleetRepository();

  async createFleet(data: CreateFleetInput) {
    const { panCardFile: _panCardFile, ...payload } = data;
    const existing = await this.fleetRepo.findByMobile(payload.mobile);
    if (existing) {
      throw new ApiError(409, "Fleet with this mobile already exists");
    }

    return this.fleetRepo.create(payload);
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

export class FleetHubService {
  private fleetHubRepo = new FleetHubRepository();
  private fleetRepo = new FleetRepository();
  private hubManagerRepo = new HubManagerRepository();
  private vehicleRepo = new VehicleRepository();

  // private driverRepo = new DriverRepository();

  async createFleetHub(fleetId: string, data: CreateFleetHubInput) {
    const fleet = await this.fleetRepo.findById(fleetId);
    if (!fleet) {
      throw new ApiError(404, "Fleet not found");
    }

    return this.fleetHubRepo.create(fleetId, data);
  }

  async getAllFleetHubs(id: string) {
    return this.fleetHubRepo.findAll(id);
  }

  async getFleetHubById(id: string) {
    const fleetHub = await this.fleetHubRepo.findById(id);
    if (!fleetHub) {
      throw new ApiError(404, "Fleet Hub not found");
    }
    return fleetHub;
  }

  async assignManager(id: string, data: AssignManagerInput) {
    const fleetHub = await this.fleetHubRepo.findById(id);
    if (!fleetHub) {
      throw new ApiError(404, "Fleet Hub not found");
    }

    const hubManager = await this.hubManagerRepo.findById(data.managerId);
    if (!hubManager) {
      throw new ApiError(404, "Hub Manager not found");
    }

    if (fleetHub.fleetId !== hubManager.fleetId) {
      throw new ApiError(
        400,
        "Hub Manager does not belong to the same Fleet as the Hub"
      );
    }

    return this.fleetHubRepo.assign(id, data);
  }

  async addVehicle(id: string, data: VehicleInput) {
    const fleetHub = await this.fleetHubRepo.findById(id);
    if (!fleetHub) {
      throw new ApiError(404, "Fleet Hub not found");
    }

    const vehicle = await this.vehicleRepo.findById(data.vehicleId);
    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }

    if (fleetHub.fleetId !== vehicle.fleetId) {
      throw new ApiError(
        400,
        "Vehicle does not belong to the same Fleet as the Hub"
      );
    }

    return this.fleetHubRepo.addVehicle(id, data);
  }

  async addDriver(id: string, data: DriverInput) {
    const fleetHub = await this.fleetHubRepo.findById(id);
    if (!fleetHub) {
      throw new ApiError(404, "Fleet Hub not found");
    }

    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }

    if (fleetHub.fleetId !== driver.fleetId) {
      throw new ApiError(
        400,
        "Driver does not belong to the same Fleet as the Hub"
      );
    }

    return this.fleetHubRepo.addDriver(id, data);
  }

  async removeVehicle(id: string, data: VehicleInput) {
    const fleetHub = await this.fleetHubRepo.findById(id);
    if (!fleetHub) {
      throw new ApiError(404, "Fleet Hub not found");
    }

    const vehicle = await this.vehicleRepo.findById(data.vehicleId);
    if (!vehicle) {
      throw new ApiError(404, "Vehicle not found");
    }

    if (vehicle.hubId !== id) {
      throw new ApiError(400, "Vehicle is not currently assigned to this Hub");
    }

    return this.fleetHubRepo.removeVehicle(id, data);
  }

  async removeDriver(id: string, data: DriverInput) {
    const fleetHub = await this.fleetHubRepo.findById(id);
    if (!fleetHub) {
      throw new ApiError(404, "Fleet Hub not found");
    }

    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) {
      throw new ApiError(404, "Driver not found");
    }

    if (driver.hubId !== id) {
      throw new ApiError(400, "Driver is not currently assigned to this Hub");
    }

    return this.fleetHubRepo.removeDriver(id, data);
  }
}

export class HubManagerService {
  private hubManagerRepo = new HubManagerRepository();

  async createHubManager(id: string, data: CreateHubManagerInput) {
    return this.hubManagerRepo.create(id, data);
  }

  async getHubManagerById(id: string) {
    const hubManager = this.hubManagerRepo.findById(id);
    if (!hubManager) {
      throw new ApiError(404, "Hub Manager not found");
    }
    return hubManager;
  }

  async getAllHubManagers(id: string) {
    return this.hubManagerRepo.findAll(id);
  }
}
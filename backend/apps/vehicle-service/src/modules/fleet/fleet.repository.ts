import { prisma, vehicleSelect } from "@driversklub/database";
import type {
  CreateFleetPayload,
  UpdateFleetStatusInput,
  FleetEntity,
  VehicleInput,
  DriverInput,
} from "./fleet.types.js";
import {
  AssignManagerInput,
  CreateFleetHubInput,
  DriverEntity,
  FleetHubEntity,
  VehicleEntity,
} from "./fleetHub.types.js";
import { CreateHubManagerInput, HubManagerEntity } from "./hubManager.types.js";

export class FleetRepository {
  async create(data: CreateFleetPayload): Promise<FleetEntity> {
    const { modeId, ...restData } = data;
    return prisma.fleet.create({
      data: {
        ...restData,
        modeId: modeId || "CAB", // Default to "CAB" if not provided
        dob: data.dob ? new Date(data.dob) : undefined,
      },
    });
  }

  async findAll(): Promise<FleetEntity[]> {
    return prisma.fleet.findMany();
  }

  async findById(id: string): Promise<FleetEntity | null> {
    return prisma.fleet.findUnique({ where: { id } });
  }

  async findByMobile(mobile: string): Promise<FleetEntity | null> {
    return prisma.fleet.findUnique({ where: { mobile } });
  }

  async updateStatus(
    id: string,
    data: UpdateFleetStatusInput
  ): Promise<FleetEntity> {
    return prisma.fleet.update({
      where: { id },
      data,
    });
  }
}

export class FleetHubRepository {
  async create(
    fleetId: string,
    data: CreateFleetHubInput
  ): Promise<FleetHubEntity> {
    return prisma.fleetHub.create({
      data: {
        fleetId,
        ...data,
      },
    });
  }

  async findAll(id: string): Promise<FleetHubEntity[]> {
    return prisma.fleetHub.findMany({ where: { fleetId: id } });
  }

  async findById(id: string): Promise<FleetHubEntity | null> {
    return prisma.fleetHub.findUnique({ where: { id } });
  }

  async assign(
    hubId: string,
    data: AssignManagerInput
  ): Promise<FleetHubEntity> {
    return prisma.fleetHub.update({
      where: {
        id: hubId,
      },
      data: {
        hubManagerId: data.managerId,
      },
    });
  }

  async addVehicle(id: string, data: VehicleInput): Promise<VehicleEntity> {
    return prisma.vehicle.update({
      where: {
        id: data.vehicleId,
      },
      data: {
        hubId: id,
      },
      select: vehicleSelect,
    });
  }

  async addDriver(id: string, data: DriverInput): Promise<DriverEntity> {
    return prisma.driver.update({
      where: {
        id: data.driverId,
      },
      data: {
        hubId: id,
      },
    });
  }

  async removeVehicle(id: string, data: VehicleInput): Promise<VehicleEntity> {
    return prisma.vehicle.update({
      where: {
        id: data.vehicleId,
        hubId: id,
      },
      data: {
        hubId: null,
      },
      select: vehicleSelect,
    });
  }

  async removeDriver(id: string, data: DriverInput): Promise<DriverEntity> {
    return prisma.driver.update({
      where: {
        id: data.driverId,
        hubId: id,
      },
      data: {
        hubId: null,
      },
    });
  }
}

export class HubManagerRepository {
  async create(
    fleetId: string,
    data: CreateHubManagerInput
  ): Promise<HubManagerEntity> {
    return prisma.hubManager.create({
      data: {
        fleetId,
        ...data,
      },
    });
  }

  async findById(id: string): Promise<HubManagerEntity | null> {
    return prisma.hubManager.findUnique({ where: { id } });
  }

  async findAll(id: string): Promise<HubManagerEntity[]> {
    return prisma.hubManager.findMany({ where: { fleetId: id } });
  }
}
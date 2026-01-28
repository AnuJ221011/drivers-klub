import { prisma } from "@driversklub/database";
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
  async create(data: CreateFleetPayload & { shortId: string }): Promise<FleetEntity> {
    const { modeId, shortId, ...restData } = data;
    return prisma.fleet.create({
      data: {
        shortId,
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
    return prisma.fleet.findFirst({
      where: {
        OR: [{ id }, { shortId: id }]
      }
    });
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
    data: CreateFleetHubInput & { shortId: string }
  ): Promise<FleetHubEntity> {
    const { shortId, ...restData } = data;
    return prisma.fleetHub.create({
      data: {
        shortId,
        fleetId,
        ...restData,
      },
    });
  }

  async findAll(id: string): Promise<FleetHubEntity[]> {
    return prisma.fleetHub.findMany({ where: { fleetId: id } });
  }

  async findById(id: string): Promise<FleetHubEntity | null> {
    return prisma.fleetHub.findFirst({
      where: {
        OR: [{ id }, { shortId: id }]
      }
    });
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
    data: CreateHubManagerInput & { shortId: string }
  ): Promise<HubManagerEntity> {
    const { shortId, ...restData } = data;
    return prisma.hubManager.create({
      data: {
        shortId,
        fleetId,
        ...restData,
      },
    });
  }

  async findById(id: string): Promise<HubManagerEntity | null> {
    return prisma.hubManager.findFirst({
      where: {
        OR: [{ id }, { shortId: id }]
      }
    });
  }

  async findAll(id: string): Promise<HubManagerEntity[]> {
    return prisma.hubManager.findMany({ where: { fleetId: id } });
  }
}